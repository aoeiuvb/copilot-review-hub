import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { store } from './store.js';
import type { WebSocketMessage } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createWebServer(port = 3000): ReturnType<typeof createServer> {
  const app = express();

  app.use(express.json());
  app.use(express.static(join(__dirname, '..', 'public')));

  // --- REST API ---

  // List reviews
  app.get('/api/reviews', (_req, res) => {
    res.json(store.listReviews());
  });

  // Get single review
  app.get('/api/reviews/:id', (req, res) => {
    const review = store.getReview(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    return res.json(review);
  });

  // Approve
  app.post('/api/reviews/:id/approve', (req, res) => {
    const { comments } = req.body as { comments?: string };
    const updated = store.updateStatus(req.params.id, 'approved', comments);
    if (!updated) return res.status(404).json({ error: 'Review not found' });
    return res.json(updated);
  });

  // Reject
  app.post('/api/reviews/:id/reject', (req, res) => {
    const { comments } = req.body as { comments?: string };
    const updated = store.updateStatus(req.params.id, 'rejected', comments);
    if (!updated) return res.status(404).json({ error: 'Review not found' });
    return res.json(updated);
  });

  // Delete
  app.delete('/api/reviews/:id', (req, res) => {
    const existed = store.deleteReview(req.params.id);
    if (!existed) return res.status(404).json({ error: 'Review not found' });
    return res.status(204).send();
  });

  // Settings
  app.get('/api/settings', (_req, res) => {
    res.json(store.getSettings());
  });

  app.post('/api/settings', (req, res) => {
    const updated = store.updateSettings(req.body);
    res.json(updated);
  });

  // --- HTTP + WebSocket server ---

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  const broadcast = (msg: WebSocketMessage): void => {
    const data = JSON.stringify(msg);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  // Forward store events to all WebSocket clients
  store.on('review_created', (review) => {
    broadcast({ type: 'review_created', payload: review });
  });
  store.on('review_updated', (review) => {
    broadcast({ type: 'review_updated', payload: review });
  });
  store.on('settings_updated', (settings) => {
    broadcast({ type: 'settings_updated', payload: settings });
  });

  // Send current state on new connection
  wss.on('connection', (ws) => {
    const init = JSON.stringify({ type: 'init', payload: store.listReviews() });
    ws.send(init);
  });

  httpServer.listen(port, () => {
    // Output to stderr so it doesn't interfere with MCP stdio
    process.stderr.write(`Review Hub UI running at http://localhost:${port}\n`);
  });

  return httpServer;
}
