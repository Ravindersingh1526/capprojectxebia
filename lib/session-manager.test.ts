import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatMessage, Session } from '@/lib/types';

// We need a fresh instance for each test, so we import the factory
// by re-importing the module with isolation
describe('SessionManager', () => {
  let sessionManager: typeof import('@/lib/session-manager').sessionManager;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/session-manager');
    sessionManager = mod.sessionManager;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeMessage(content: string, role: 'user' | 'assistant' = 'user'): ChatMessage {
    return {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };
  }

  describe('createSession', () => {
    it('should create a session with a unique ID', () => {
      const session = sessionManager.createSession();
      expect(session.id).toBeDefined();
      expect(typeof session.id).toBe('string');
      expect(session.id.length).toBeGreaterThan(0);
    });

    it('should create sessions with state awaiting_name', () => {
      const session = sessionManager.createSession();
      expect(session.state).toBe('awaiting_name');
    });

    it('should create sessions with null guestName', () => {
      const session = sessionManager.createSession();
      expect(session.guestName).toBeNull();
    });

    it('should create sessions with empty messages array', () => {
      const session = sessionManager.createSession();
      expect(session.messages).toEqual([]);
    });

    it('should create sessions with empty bookings array', () => {
      const session = sessionManager.createSession();
      expect(session.bookings).toEqual([]);
    });

    it('should generate unique IDs for each session', () => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();
      expect(session1.id).not.toBe(session2.id);
    });

    it('should set createdAt and lastActivityAt to current time', () => {
      const before = Date.now();
      const session = sessionManager.createSession();
      const after = Date.now();

      expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(session.createdAt.getTime()).toBeLessThanOrEqual(after);
      expect(session.lastActivityAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(session.lastActivityAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('getSession', () => {
    it('should return the session by ID', () => {
      const created = sessionManager.createSession();
      const retrieved = sessionManager.getSession(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
    });

    it('should return null for non-existent session ID', () => {
      const result = sessionManager.getSession('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('isExpired', () => {
    it('should return false for a recently created session', () => {
      const session = sessionManager.createSession();
      expect(sessionManager.isExpired(session)).toBe(false);
    });

    it('should return true if lastActivityAt is more than 30 minutes ago', () => {
      const session = sessionManager.createSession();
      // Set lastActivityAt to 31 minutes ago
      session.lastActivityAt = new Date(Date.now() - 31 * 60 * 1000);
      expect(sessionManager.isExpired(session)).toBe(true);
    });

    it('should return false if lastActivityAt is exactly 30 minutes ago', () => {
      const session = sessionManager.createSession();
      session.lastActivityAt = new Date(Date.now() - 30 * 60 * 1000);
      expect(sessionManager.isExpired(session)).toBe(false);
    });

    it('should return false if lastActivityAt is 29 minutes ago', () => {
      const session = sessionManager.createSession();
      session.lastActivityAt = new Date(Date.now() - 29 * 60 * 1000);
      expect(sessionManager.isExpired(session)).toBe(false);
    });
  });

  describe('addMessage', () => {
    it('should add a message to the session', () => {
      const session = sessionManager.createSession();
      const msg = makeMessage('Hello');
      sessionManager.addMessage(session.id, msg);

      const updated = sessionManager.getSession(session.id)!;
      expect(updated.messages).toHaveLength(1);
      expect(updated.messages[0].content).toBe('Hello');
    });

    it('should update lastActivityAt when adding a message', () => {
      const session = sessionManager.createSession();
      const originalActivity = session.lastActivityAt.getTime();

      // Small delay to ensure timestamp difference
      const msg = makeMessage('Hello');
      sessionManager.addMessage(session.id, msg);

      const updated = sessionManager.getSession(session.id)!;
      expect(updated.lastActivityAt.getTime()).toBeGreaterThanOrEqual(originalActivity);
    });

    it('should enforce 50-message cap with FIFO eviction', () => {
      const session = sessionManager.createSession();

      // Add 55 messages
      for (let i = 0; i < 55; i++) {
        sessionManager.addMessage(session.id, makeMessage(`Message ${i}`));
      }

      const updated = sessionManager.getSession(session.id)!;
      expect(updated.messages).toHaveLength(50);
      // First message should be Message 5 (oldest 5 removed)
      expect(updated.messages[0].content).toBe('Message 5');
      // Last message should be Message 54
      expect(updated.messages[49].content).toBe('Message 54');
    });

    it('should not exceed 50 messages when exactly at the cap', () => {
      const session = sessionManager.createSession();

      for (let i = 0; i < 50; i++) {
        sessionManager.addMessage(session.id, makeMessage(`Message ${i}`));
      }

      const updated = sessionManager.getSession(session.id)!;
      expect(updated.messages).toHaveLength(50);
      expect(updated.messages[0].content).toBe('Message 0');
    });

    it('should do nothing for a non-existent session', () => {
      // Should not throw
      sessionManager.addMessage('fake-id', makeMessage('Hello'));
    });
  });

  describe('clearSession', () => {
    it('should reset the session state to awaiting_name', () => {
      const session = sessionManager.createSession();
      session.state = 'active';
      session.guestName = 'John';
      sessionManager.addMessage(session.id, makeMessage('Hello'));

      const cleared = sessionManager.clearSession(session.id);
      expect(cleared.state).toBe('awaiting_name');
    });

    it('should clear guestName to null', () => {
      const session = sessionManager.createSession();
      session.guestName = 'John';

      const cleared = sessionManager.clearSession(session.id);
      expect(cleared.guestName).toBeNull();
    });

    it('should clear messages', () => {
      const session = sessionManager.createSession();
      sessionManager.addMessage(session.id, makeMessage('Hello'));

      const cleared = sessionManager.clearSession(session.id);
      expect(cleared.messages).toEqual([]);
    });

    it('should clear bookings', () => {
      const session = sessionManager.createSession();

      const cleared = sessionManager.clearSession(session.id);
      expect(cleared.bookings).toEqual([]);
    });

    it('should reuse the same session ID', () => {
      const session = sessionManager.createSession();
      const originalId = session.id;

      const cleared = sessionManager.clearSession(session.id);
      expect(cleared.id).toBe(originalId);
    });

    it('should be retrievable after clearing', () => {
      const session = sessionManager.createSession();
      const cleared = sessionManager.clearSession(session.id);

      const retrieved = sessionManager.getSession(cleared.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.state).toBe('awaiting_name');
    });
  });
});
