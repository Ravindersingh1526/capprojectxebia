import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ChatMessage } from '@/lib/types';

/**
 * Property 1: Session history maintains a bounded sliding window
 *
 * For any sequence of N messages added to a conversation session,
 * the session SHALL retain exactly min(N, 50) messages, and those
 * messages SHALL be the N most recently added messages in their original order.
 *
 * Validates: Requirements 1.2, 6.2
 */
describe('Feature: hotel-ai-chat-assistant, Property 1: Session history bounded sliding window', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('session history retains exactly min(N, 50) most recent messages in order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 200 }),
        async (N) => {
          // Reset modules to get a fresh singleton instance
          vi.resetModules();
          const { sessionManager } = await import('@/lib/session-manager');

          // Create a fresh session
          const session = sessionManager.createSession();

          // Add N messages
          for (let i = 0; i < N; i++) {
            const message: ChatMessage = {
              id: `msg-${i}`,
              role: 'user',
              content: `Message ${i}`,
              timestamp: new Date(),
            };
            sessionManager.addMessage(session.id, message);
          }

          // Retrieve the session to check state
          const updatedSession = sessionManager.getSession(session.id);
          expect(updatedSession).not.toBeNull();

          const expectedLength = Math.min(N, 50);

          // Property: session retains exactly min(N, 50) messages
          expect(updatedSession!.messages.length).toBe(expectedLength);

          // Property: retained messages are the LAST min(N, 50) messages in original order
          const firstRetainedIndex = N - expectedLength;
          expect(updatedSession!.messages[0].content).toBe(`Message ${firstRetainedIndex}`);
          expect(updatedSession!.messages[expectedLength - 1].content).toBe(`Message ${N - 1}`);

          // Property: all retained messages are in original order
          for (let j = 0; j < expectedLength; j++) {
            expect(updatedSession!.messages[j].content).toBe(`Message ${firstRetainedIndex + j}`);
          }
        }
      ),
      { numRuns: 100, seed: Date.now(), verbose: true }
    );
  });
});
