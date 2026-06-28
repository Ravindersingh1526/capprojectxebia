import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 2: Session expiry is determined by inactivity duration
 *
 * For any conversation session with a `lastActivityAt` timestamp, the session
 * SHALL be classified as expired if and only if the elapsed time between
 * `lastActivityAt` and the current time exceeds 30 minutes.
 *
 * **Validates: Requirements 1.5, 6.5**
 *
 * Tag: Feature: hotel-ai-chat-assistant, Property 2: Session expiry by inactivity duration
 */
describe('Feature: hotel-ai-chat-assistant, Property 2: Session expiry by inactivity duration', () => {
  let sessionManager: typeof import('@/lib/session-manager').sessionManager;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/session-manager');
    sessionManager = mod.sessionManager;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const THIRTY_MINUTES_MS = 30 * 60 * 1000; // 1,800,000ms

  it('should classify session as expired if and only if elapsed time exceeds 30 minutes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 120 * 60 * 1000 }), // 0 to 2 hours in ms
        (elapsedMs) => {
          const session = sessionManager.createSession();
          // Set lastActivityAt to `elapsedMs` milliseconds ago
          session.lastActivityAt = new Date(Date.now() - elapsedMs);

          const expired = sessionManager.isExpired(session);

          if (elapsedMs > THIRTY_MINUTES_MS) {
            expect(expired).toBe(true);
          } else {
            expect(expired).toBe(false);
          }
        }
      ),
      { numRuns: 100, seed: Date.now(), verbose: true }
    );
  });
});
