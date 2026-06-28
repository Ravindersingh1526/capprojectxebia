import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the hotel-agent module before importing the route
vi.mock('@/lib/hotel-agent', () => ({
  runHotelAgent: vi.fn(),
  hotelAgent: {},
  HotelAgentContext: {},
}));

import { POST } from '@/app/api/chat/route';
import { runHotelAgent } from '@/lib/hotel-agent';
import { sessionManager } from '@/lib/session-manager';

const mockRunHotelAgent = vi.mocked(runHotelAgent);

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Integration: Chat API Route', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'sk-test-key';
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('Full conversation flow', () => {
    it('captures guest name and returns welcome greeting on first message', async () => {
      const req = createRequest({ message: 'Alice' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.sessionId).toBeDefined();
      expect(data.reply).toContain('Welcome to Saltystaz Gurgaon');
      expect(data.reply).toContain('Alice');
    });

    it('handles follow-up question via agent after name capture', async () => {
      // Step 1: name capture
      const nameReq = createRequest({ message: 'Bob' });
      const nameRes = await POST(nameReq);
      const nameData = await nameRes.json();
      const sessionId = nameData.sessionId;

      // Step 2: follow-up question — agent handles it
      mockRunHotelAgent.mockResolvedValueOnce({
        finalOutput: 'Check-in time is 2:00 PM. Is there anything else I can help you with?',
        newItems: [],
        lastResponseId: null,
      });

      const questionReq = createRequest({
        sessionId,
        message: 'What is the check-in time?',
      });
      const questionRes = await POST(questionReq);
      const questionData = await questionRes.json();

      expect(questionRes.status).toBe(200);
      expect(questionData.sessionId).toBe(sessionId);
      expect(questionData.reply).toContain('Check-in time is 2:00 PM');
      expect(mockRunHotelAgent).toHaveBeenCalledTimes(1);
    });

    it('passes conversation history to agent on subsequent messages', async () => {
      // Step 1: name capture
      const nameReq = createRequest({ message: 'Charlie' });
      const nameRes = await POST(nameReq);
      const nameData = await nameRes.json();
      const sessionId = nameData.sessionId;

      // Step 2: first question
      mockRunHotelAgent.mockResolvedValueOnce({
        finalOutput: 'We have Deluxe and Executive rooms available.',
        newItems: [],
        lastResponseId: null,
      });

      await POST(createRequest({ sessionId, message: 'What rooms do you have?' }));

      // Step 3: follow-up question
      mockRunHotelAgent.mockResolvedValueOnce({
        finalOutput: 'The Deluxe Room costs ₹8,000 per night.',
        newItems: [],
        lastResponseId: null,
      });

      await POST(createRequest({ sessionId, message: 'How much is the deluxe?' }));

      // Verify the agent was called with conversation history (array input)
      const lastCall = mockRunHotelAgent.mock.calls[1];
      const input = lastCall[0];
      // When there are multiple messages in history, the route passes an array
      expect(Array.isArray(input)).toBe(true);
    });
  });

  describe('Booking flow end-to-end', () => {
    it('handles a complete booking inquiry and confirmation flow', async () => {
      // Step 1: name capture
      const nameReq = createRequest({ message: 'Priya' });
      const nameRes = await POST(nameReq);
      const nameData = await nameRes.json();
      const sessionId = nameData.sessionId;

      // Step 2: booking inquiry — agent returns availability info
      mockRunHotelAgent.mockResolvedValueOnce({
        finalOutput:
          'I found these options for you:\n1. Deluxe Room - ₹8,000/night (Total: ₹16,000)\n2. Executive Suite - ₹15,000/night (Total: ₹30,000)\nWould you like to book one of these?',
        newItems: [],
        lastResponseId: null,
      });

      const inquiryReq = createRequest({
        sessionId,
        message: 'I want to book a room for July 10 to July 12',
      });
      const inquiryRes = await POST(inquiryReq);
      const inquiryData = await inquiryRes.json();

      expect(inquiryRes.status).toBe(200);
      expect(inquiryData.reply).toContain('Deluxe Room');
      expect(inquiryData.reply).toContain('Executive Suite');

      // Step 3: booking confirmation — agent returns confirmation
      mockRunHotelAgent.mockResolvedValueOnce({
        finalOutput:
          'Your booking is confirmed! Here are the details:\n- Confirmation Number: STZ-20250710-001\n- Room: Deluxe Room\n- Check-in: 2025-07-10\n- Check-out: 2025-07-12\n- Total Cost: ₹16,000\nHave a wonderful stay, Priya!',
        newItems: [],
        lastResponseId: null,
      });

      const confirmReq = createRequest({
        sessionId,
        message: 'Please book the Deluxe Room',
      });
      const confirmRes = await POST(confirmReq);
      const confirmData = await confirmRes.json();

      expect(confirmRes.status).toBe(200);
      expect(confirmData.reply).toContain('STZ-20250710-001');
      expect(confirmData.reply).toContain('Deluxe Room');
      expect(confirmData.reply).toContain('Priya');
    });
  });

  describe('Error scenarios', () => {
    it('returns 503 when agent throws timeout error', async () => {
      // Create session and capture name
      const nameRes = await POST(createRequest({ message: 'TestUser' }));
      const { sessionId } = await nameRes.json();

      // Mock agent timeout
      mockRunHotelAgent.mockRejectedValueOnce(new Error('Request timeout exceeded'));

      const req = createRequest({ sessionId, message: 'Hello' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.error).toContain('trouble responding');
    });

    it('returns 429 when agent throws rate limit error', async () => {
      // Create session and capture name
      const nameRes = await POST(createRequest({ message: 'TestUser2' }));
      const { sessionId } = await nameRes.json();

      // Mock rate limit error
      mockRunHotelAgent.mockRejectedValueOnce(new Error('Rate limit exceeded: too many requests'));

      const req = createRequest({ sessionId, message: 'Hello' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(429);
      expect(data.error).toContain('busy right now');
    });

    it('returns 500 when agent throws authentication error', async () => {
      // Create session and capture name
      const nameRes = await POST(createRequest({ message: 'TestUser3' }));
      const { sessionId } = await nameRes.json();

      // Mock auth error
      mockRunHotelAgent.mockRejectedValueOnce(
        new Error('Authentication failed: invalid api key')
      );

      const req = createRequest({ sessionId, message: 'Hello' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('configuration error');
    });

    it('returns 503 for generic agent errors', async () => {
      // Create session and capture name
      const nameRes = await POST(createRequest({ message: 'TestUser4' }));
      const { sessionId } = await nameRes.json();

      // Mock generic error
      mockRunHotelAgent.mockRejectedValueOnce(new Error('Something unexpected happened'));

      const req = createRequest({ sessionId, message: 'Hello' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.error).toContain('trouble responding');
    });

    it('returns 500 when OPENAI_API_KEY is not set', async () => {
      delete process.env.OPENAI_API_KEY;

      const req = createRequest({ message: 'Hello' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('configuration error');
    });

    it('returns 400 for empty message', async () => {
      const req = createRequest({ message: '' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('returns 400 for whitespace-only message', async () => {
      const req = createRequest({ message: '   \t\n  ' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('Session expiry', () => {
    it('creates a new session and flags expiry when session has timed out', async () => {
      // Step 1: create session via name capture
      const nameRes = await POST(createRequest({ message: 'ExpireUser' }));
      const nameData = await nameRes.json();
      const originalSessionId = nameData.sessionId;

      // Step 2: manually expire the session by setting lastActivityAt to 31 min ago
      const session = sessionManager.getSession(originalSessionId);
      expect(session).not.toBeNull();
      session!.lastActivityAt = new Date(Date.now() - 31 * 60 * 1000);

      // Step 3: send a message with expired sessionId — should get new session + expiry flag
      const req = createRequest({
        sessionId: originalSessionId,
        message: 'Diana',
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      // New session created, so session ID changes
      expect(data.sessionId).not.toBe(originalSessionId);
      // Metadata should indicate session expired
      expect(data.metadata?.sessionExpired).toBe(true);
      // Since the new session is in awaiting_name state, the message is treated as a name
      expect(data.reply).toContain('Welcome to Saltystaz Gurgaon');
      expect(data.reply).toContain('Diana');
    });

    it('creates new session when sessionId does not exist', async () => {
      const req = createRequest({
        sessionId: 'non-existent-session-id',
        message: 'Eve',
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.sessionId).toBeDefined();
      expect(data.sessionId).not.toBe('non-existent-session-id');
      // Treated as new session — name capture
      expect(data.reply).toContain('Welcome to Saltystaz Gurgaon');
      expect(data.reply).toContain('Eve');
    });
  });
});
