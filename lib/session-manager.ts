import crypto from 'crypto';
import { Session, ChatMessage } from '@/lib/types';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_MESSAGES = 50;

export interface SessionManager {
  createSession(): Session;
  getSession(id: string): Session | null;
  isExpired(session: Session): boolean;
  addMessage(sessionId: string, message: ChatMessage): void;
  clearSession(sessionId: string): Session;
}

function createSessionManager(): SessionManager {
  const sessions = new Map<string, Session>();

  return {
    createSession(): Session {
      const id = crypto.randomUUID();
      const now = new Date();
      const session: Session = {
        id,
        guestName: null,
        messages: [],
        createdAt: now,
        lastActivityAt: now,
        bookings: [],
        state: 'awaiting_name',
      };
      sessions.set(id, session);
      return session;
    },

    getSession(id: string): Session | null {
      return sessions.get(id) ?? null;
    },

    isExpired(session: Session): boolean {
      const elapsed = Date.now() - session.lastActivityAt.getTime();
      return elapsed > SESSION_TIMEOUT_MS;
    },

    addMessage(sessionId: string, message: ChatMessage): void {
      const session = sessions.get(sessionId);
      if (!session) return;

      session.messages.push(message);
      session.lastActivityAt = new Date();

      // Enforce 50-message cap with FIFO eviction (remove oldest)
      if (session.messages.length > MAX_MESSAGES) {
        session.messages = session.messages.slice(session.messages.length - MAX_MESSAGES);
      }
    },

    clearSession(sessionId: string): Session {
      const now = new Date();
      const existing = sessions.get(sessionId);

      const newSession: Session = {
        id: existing?.id ?? crypto.randomUUID(),
        guestName: null,
        messages: [],
        createdAt: now,
        lastActivityAt: now,
        bookings: [],
        state: 'awaiting_name',
      };

      sessions.set(newSession.id, newSession);
      return newSession;
    },
  };
}

// Export singleton instance
export const sessionManager = createSessionManager();
