import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update path to persist data
const DATA_DIR = '/tmp/copilot-review-hub-sessions';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface ReviewSession {
  sessionId: string;
  taskId: string;
  taskTitle: string; // New field for aggregated task title
  title: string;
  summary: string;
  details: string;
  status: 'pending' | 'approved' | 'needs_revision';
  feedback?: string;
  createdAt: number;
  updatedAt: number;
}

class SharedState {
  private getFilePath(sessionId: string): string {
    return path.join(DATA_DIR, `${sessionId}.json`);
  }

  createSession(taskId: string, taskTitle: string, title: string, summary: string, details: string): ReviewSession {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ReviewSession = {
      sessionId,
      taskId,
      taskTitle: taskTitle, // No fallback to title
      title,
      summary,
      details,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    fs.writeFileSync(this.getFilePath(sessionId), JSON.stringify(session, null, 2));
    return session;
  }

  getSession(sessionId: string): ReviewSession | undefined {
    const filePath = this.getFilePath(sessionId);
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.error(`Error reading session ${sessionId}:`, e);
      }
    }
    return undefined;
  }

  getSessions(options: { limit?: number; before?: number; after?: number } = {}): ReviewSession[] {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    let sessions = files
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')) as ReviewSession;
        } catch (e) {
          return null;
        }
      })
      .filter((s): s is ReviewSession => s !== null);

    // Filter by timestamp if provided
    if (options.after) {
      sessions = sessions.filter(s => s.updatedAt > options.after!);
    }
    if (options.before) {
      sessions = sessions.filter(s => s.createdAt < options.before!);
    }

    // Sort by createdAt descending (newest first) by default
    sessions.sort((a, b) => b.createdAt - a.createdAt);

    // Limit results
    if (options.limit && options.limit > 0) {
      sessions = sessions.slice(0, options.limit);
    }

    return sessions;
  }
  
  // Helper to get pending sessions quickly
  getPendingSessions(): ReviewSession[] {
    return this.getSessions().filter(s => s.status === 'pending');
  }
  
  // Helper to get all sessions without limit
  getAllSessions(): ReviewSession[] {
     return this.getSessions();
  }

  // Fix persistence issue: The injection used 'test-notify-1' but createSession makes 'sess_...'.
  // But our persistence logic uses getFilePath(sessionId).
  // If we manually created files like /tmp/.../test_notification_1.json, the sessionId inside was 'test-notify-1'.
  // However, getFilePath('test-notify-1') returns .../test-notify-1.json.
  // The issue is likely that I created the files as `test_notification_1.json` but the sessionId inside is `test-notify-1`.
  // When provideFeedback calls getFilePath('test-notify-1'), it looks for `test-notify-1.json`, which doesn't exist (it's `test_notification_1.json`).
  //
  // FIX: We need to ensure we can find the file for a given sessionId, regardless of filename.
  // OR, we just fix the test injection to match the filename pattern.
  // Let's make getFilePath smarter or just iterate to find.
  
  private findFileBySessionId(sessionId: string): string | undefined {
    // Fast path: standard naming
    const standardPath = this.getFilePath(sessionId);
    if (fs.existsSync(standardPath)) return standardPath;
    
    // Slow path: scan all files (only needed for manually injected bad-named files)
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    for (const f of files) {
      try {
        const fullPath = path.join(DATA_DIR, f);
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        if (content.sessionId === sessionId) return fullPath;
      } catch(e) {}
    }
    return undefined;
  }

  provideFeedback(sessionId: string, feedback: string): boolean {
    // Use the robust finder
    const filePath = this.findFileBySessionId(sessionId);
    if (!filePath) return false;
    
    const session = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ReviewSession;
    
    // Determine status from feedback content (handled by caller now, but we keep this as fallback/safety)
    // Actually, the caller (server.ts) passes the status in the body now, but this method signature only takes feedback string?
    // Wait, the server code says: sharedState.provideFeedback(sessionId, finalFeedback);
    // And it calculates status before calling. 
    // BUT look at line 110 in shared-state.ts: it recalculates status based on text!
    // This OVERRIDES the user's explicit button choice if the text doesn't match the regex.
    // We should allow passing status explicitly.
    
    // Let's overload or change the signature. To be safe, I'll update the signature to accept optional status.
    return this.updateSessionWithFeedback(session, filePath, feedback);
  }
  
  // New method to support explicit status
  provideFeedbackWithStatus(sessionId: string, feedback: string, status: 'approved' | 'needs_revision'): boolean {
    const filePath = this.findFileBySessionId(sessionId);
    if (!filePath) return false;
    const session = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ReviewSession;
    
    session.feedback = feedback;
    session.status = status;
    session.updatedAt = Date.now();
    
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    return true;
  }

  private updateSessionWithFeedback(session: ReviewSession, filePath: string, feedback: string): boolean {
    // Legacy logic for backward compatibility if needed, but we should prefer explicit status
    let newStatus: 'approved' | 'needs_revision' = 'needs_revision';
    const feedbackLower = feedback.toLowerCase();
    
    if (feedbackLower.startsWith('approved') || 
        feedbackLower.includes('lgtm') || 
        feedbackLower.includes('ok') ||
        feedbackLower.includes('通过')) {
      newStatus = 'approved';
    }

    session.feedback = feedback;
    session.status = newStatus;
    session.updatedAt = Date.now();
    
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    return true;
  }
}

export const sharedState = new SharedState();
