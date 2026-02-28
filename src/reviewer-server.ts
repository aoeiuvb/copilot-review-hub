import express, { Request, Response } from 'express';
import { sharedState } from './shared-state.js';
import next from 'next';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const nextApp = (next as any)({ dev });
const handle = nextApp.getRequestHandler();

export async function startReviewerServer() {
  try {
    console.log('Preparing Next.js app...');
    await nextApp.prepare();
    console.log('Next.js app prepared.');

    const app = express();
    const PORT = 3456;

    // Middleware
    app.use(express.json());
    
    // API: Get all review sessions
    app.get('/api/sessions', (req: Request, res: Response) => {
      const after = req.query.after ? parseInt(req.query.after as string, 10) : undefined;
      const before = req.query.before ? parseInt(req.query.before as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const since = req.query.since ? parseInt(req.query.since as string, 10) : undefined;

      const effectiveAfter = after || since;

      const sessions = sharedState.getSessions({ 
        after: effectiveAfter,
        before,
        limit 
      });
      
      res.json({ sessions, timestamp: Date.now() });
    });

    // API: Get specific session details
    app.get('/api/sessions/:sessionId', (req: Request, res: Response) => {
      const { sessionId } = req.params;
      const session = sharedState.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json({ session });
    });

    // API: Submit review feedback
    app.post('/api/sessions/:sessionId/feedback', (req: Request, res: Response) => {
      const { sessionId } = req.params;
      const { feedback, status } = req.body;
      
      if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
        if (status === 'approved') {
          // Allowed
        } else {
          return res.status(400).json({ error: 'Feedback is required and must be a non-empty string' });
        }
      }
      
      let finalFeedback = feedback ? feedback.trim() : '';
      if (status === 'approved' && !finalFeedback) {
        finalFeedback = 'Approved';
      }

      if (status === 'needs_revision') {
        if (!finalFeedback.toLowerCase().startsWith('request changes') && 
            !finalFeedback.toLowerCase().startsWith('reject')) {
          finalFeedback = `Request Changes: ${finalFeedback}`;
        }
      } else if (status === 'approved') {
        if (!finalFeedback.toLowerCase().includes('ok') && 
            !finalFeedback.toLowerCase().includes('approv') &&
            !finalFeedback.toLowerCase().includes('lgtm') &&
            !finalFeedback.toLowerCase().includes('通过')) {
            finalFeedback = `Approved: ${finalFeedback}`;
        }
      }

      const success = sharedState.provideFeedbackWithStatus(sessionId, finalFeedback, status as 'approved' | 'needs_revision');
      
      if (!success) {
        return res.status(404).json({ error: 'Session not found or already reviewed' });
      }
      
      const session = sharedState.getSession(sessionId);
      res.json({ 
        success: true, 
        session,
        message: session?.status === 'approved' 
          ? 'Review approved - Agent can proceed' 
          : 'Feedback provided - Agent will address the issues'
      });
    });

    // API: Get Statistics
    app.get('/api/stats', (_req: Request, res: Response) => {
      const allSessions = sharedState.getSessions();
      const pending = allSessions.filter(s => s.status === 'pending').length;
      const approved = allSessions.filter(s => s.status === 'approved').length;
      const rejected = allSessions.filter(s => s.status === 'needs_revision').length;
      
      res.json({
        total: allSessions.length,
        pending,
        approved,
        rejected
      });
    });

    // Handle all other requests with Next.js
    app.all('*', (req: Request, res: Response) => {
      return handle(req, res);
    });

    const server = app.listen(PORT, () => {
      console.log(`Reviewer Server running at http://localhost:${PORT}`);
    });

    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Assuming another instance is running.`);
        console.log(`MCP server will continue to run and use the existing dashboard.`);
      } else {
        console.error('Server error:', e);
        throw e;
      }
    });
  } catch (e) {
    console.error('Failed to start server:', e);
    // Do not exit process, let MCP continue
    // process.exit(1); 
  }
}
