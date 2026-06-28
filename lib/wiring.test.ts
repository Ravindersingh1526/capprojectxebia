import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatMessage } from '@/lib/types';

/**
 * Wiring verification tests — ensures all modules connect correctly:
 * API Route → Session Manager → Hotel Agent → Booking Engine / FAQ Module → Mock Data Store
 *
 * These tests do NOT call the OpenAI API. They verify the integration between
 * local modules that can be tested independently.
 */

describe('End-to-End Wiring Verification', () => {
  describe('Session Manager → State Tracking', () => {
    let sessionManager: typeof import('@/lib/session-manager').sessionManager;

    beforeEach(async () => {
      vi.resetModules();
      const mod = await import('@/lib/session-manager');
      sessionManager = mod.sessionManager;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create a session in awaiting_name state and transition to active', () => {
      const session = sessionManager.createSession();
      expect(session.state).toBe('awaiting_name');
      expect(session.guestName).toBeNull();

      // Simulate name capture (as the API route does)
      session.guestName = 'Rahul';
      session.state = 'active';

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.state).toBe('active');
      expect(retrieved!.guestName).toBe('Rahul');
    });

    it('should track messages across session lifecycle', () => {
      const session = sessionManager.createSession();

      const userMsg: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Rahul',
        timestamp: new Date(),
      };
      sessionManager.addMessage(session.id, userMsg);

      const assistantMsg: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Welcome to Saltystaz Gurgaon, Rahul!',
        timestamp: new Date(),
      };
      sessionManager.addMessage(session.id, assistantMsg);

      const retrieved = sessionManager.getSession(session.id)!;
      expect(retrieved.messages).toHaveLength(2);
      expect(retrieved.messages[0].role).toBe('user');
      expect(retrieved.messages[1].role).toBe('assistant');
    });

    it('should detect session timeout after 30 minutes of inactivity', () => {
      const session = sessionManager.createSession();
      expect(sessionManager.isExpired(session)).toBe(false);

      // Simulate 31 minutes of inactivity
      session.lastActivityAt = new Date(Date.now() - 31 * 60 * 1000);
      expect(sessionManager.isExpired(session)).toBe(true);
    });

    it('should support session reset (start over)', () => {
      const session = sessionManager.createSession();
      session.state = 'active';
      session.guestName = 'Priya';

      const userMsg: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'What rooms are available?',
        timestamp: new Date(),
      };
      sessionManager.addMessage(session.id, userMsg);

      // Clear session (simulating "start over")
      const cleared = sessionManager.clearSession(session.id);
      expect(cleared.state).toBe('awaiting_name');
      expect(cleared.guestName).toBeNull();
      expect(cleared.messages).toEqual([]);
    });
  });

  describe('Booking Engine → Mock Data Store Wiring', () => {
    let bookingEngine: typeof import('@/lib/booking-engine').bookingEngine;
    let mockDataStore: typeof import('@/lib/mock-data').mockDataStore;

    beforeEach(async () => {
      vi.resetModules();
      const beMod = await import('@/lib/booking-engine');
      const mdsMod = await import('@/lib/mock-data');
      bookingEngine = beMod.bookingEngine;
      mockDataStore = mdsMod.mockDataStore;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    function getFutureDate(daysFromNow: number): string {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      return date.toISOString().split('T')[0];
    }

    it('should check availability using mock data store', () => {
      const checkIn = getFutureDate(5);
      const checkOut = getFutureDate(7);

      const results = bookingEngine.checkAvailability(checkIn, checkOut);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);

      // Verify result structure matches expected interface
      for (const room of results) {
        expect(room).toHaveProperty('roomTypeId');
        expect(room).toHaveProperty('name');
        expect(room).toHaveProperty('pricePerNight');
        expect(room).toHaveProperty('totalCost');
        expect(room).toHaveProperty('maxGuests');
        expect(room.pricePerNight).toBeGreaterThan(0);
        expect(room.totalCost).toBe(room.pricePerNight * 2); // 2 nights
      }
    });

    it('should create a booking and decrement availability', () => {
      const checkIn = getFutureDate(10);
      const checkOut = getFutureDate(12);
      const roomType = 'deluxe-room';

      // Check initial availability
      const initialAvail = mockDataStore.getAvailability(roomType, checkIn);
      expect(initialAvail).toBeGreaterThan(0);

      // Create booking
      const confirmation = bookingEngine.createBooking(
        {
          checkInDate: checkIn,
          checkOutDate: checkOut,
          roomType,
          guestName: 'Test Guest',
        },
        'session-123'
      );

      // Verify confirmation structure
      expect(confirmation.confirmationNumber).toMatch(/^STZ-\d{8}-\d{3}$/);
      expect(confirmation.roomType).toBe(roomType);
      expect(confirmation.checkInDate).toBe(checkIn);
      expect(confirmation.checkOutDate).toBe(checkOut);
      expect(confirmation.guestName).toBe('Test Guest');
      expect(confirmation.pricePerNight).toBeGreaterThan(0);
      expect(confirmation.totalCost).toBe(confirmation.pricePerNight * 2);

      // Verify availability decremented
      const afterAvail = mockDataStore.getAvailability(roomType, checkIn);
      expect(afterAvail).toBe(initialAvail - 1);
    });

    it('should cancel a booking and restore availability', () => {
      const checkIn = getFutureDate(15);
      const checkOut = getFutureDate(17);
      const roomType = 'executive-suite';
      const sessionId = 'session-456';

      // Record initial availability
      const initialAvail = mockDataStore.getAvailability(roomType, checkIn);

      // Create booking
      const confirmation = bookingEngine.createBooking(
        {
          checkInDate: checkIn,
          checkOutDate: checkOut,
          roomType,
          guestName: 'Cancel Guest',
        },
        sessionId
      );

      // Verify availability decreased
      expect(mockDataStore.getAvailability(roomType, checkIn)).toBe(initialAvail - 1);

      // Cancel booking
      const cancelled = bookingEngine.cancelBooking(confirmation.confirmationNumber, sessionId);
      expect(cancelled).toBe(true);

      // Verify availability restored
      expect(mockDataStore.getAvailability(roomType, checkIn)).toBe(initialAvail);
    });

    it('should not cancel a booking from a different session', () => {
      const checkIn = getFutureDate(20);
      const checkOut = getFutureDate(22);

      const confirmation = bookingEngine.createBooking(
        {
          checkInDate: checkIn,
          checkOutDate: checkOut,
          roomType: 'deluxe-room',
          guestName: 'Session Owner',
        },
        'session-owner'
      );

      // Try to cancel from different session
      const cancelled = bookingEngine.cancelBooking(
        confirmation.confirmationNumber,
        'different-session'
      );
      expect(cancelled).toBe(false);
    });

    it('should validate dates before creating booking', () => {
      const result = bookingEngine.validateDates('2020-01-01', '2020-01-05');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('checkin_in_past');
    });
  });

  describe('FAQ Module → Mock Data Store Wiring', () => {
    let faqModule: typeof import('@/lib/faq-module').faqModule;

    beforeEach(async () => {
      vi.resetModules();
      const mod = await import('@/lib/faq-module');
      faqModule = mod.faqModule;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return check-in time from mock data', () => {
      const checkInTime = faqModule.getCheckInTime();
      expect(checkInTime).toBe('2:00 PM');
    });

    it('should return check-out time from mock data', () => {
      const checkOutTime = faqModule.getCheckOutTime();
      expect(checkOutTime).toBe('12:00 PM');
    });

    it('should return amenities list from mock data', () => {
      const amenities = faqModule.getAmenities();
      expect(amenities.length).toBeGreaterThanOrEqual(5);
      for (const amenity of amenities) {
        expect(amenity.name).toBeTruthy();
        expect(amenity.description).toBeTruthy();
      }
    });

    it('should return policies from mock data', () => {
      const cancellation = faqModule.getPolicy('cancellation');
      expect(cancellation).not.toBeNull();
      expect(cancellation!.length).toBeGreaterThan(0);

      const pets = faqModule.getPolicy('pets');
      expect(pets).not.toBeNull();

      const smoking = faqModule.getPolicy('smoking');
      expect(smoking).not.toBeNull();

      const parking = faqModule.getPolicy('parking');
      expect(parking).not.toBeNull();
    });

    it('should return null for unknown policy type', () => {
      const result = faqModule.getPolicy('unknown_policy');
      expect(result).toBeNull();
    });

    it('should return room pricing from mock data', () => {
      const rooms = faqModule.getRoomPricing();
      expect(rooms.length).toBeGreaterThanOrEqual(3);
      for (const room of rooms) {
        expect(room.name).toBeTruthy();
        expect(room.pricePerNight).toBeGreaterThan(0);
      }
    });

    it('should handle all getHotelInfo topics correctly', () => {
      const topics = [
        'check_in_time',
        'check_out_time',
        'amenities',
        'cancellation_policy',
        'pet_policy',
        'smoking_policy',
        'parking',
        'room_pricing',
      ];

      for (const topic of topics) {
        const info = faqModule.getHotelInfo(topic);
        expect(info).not.toBeNull();
        expect(typeof info).toBe('string');
        expect(info!.length).toBeGreaterThan(0);
      }
    });

    it('should return null for unknown topics', () => {
      const result = faqModule.getHotelInfo('swimming_lessons');
      expect(result).toBeNull();
    });
  });

  describe('API Route → Missing OPENAI_API_KEY', () => {
    beforeEach(() => {
      vi.resetModules();
      // Ensure OPENAI_API_KEY is not set
      delete process.env.OPENAI_API_KEY;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return 500 when OPENAI_API_KEY is not set', async () => {
      const { POST } = await import('@/app/api/chat/route');

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Service configuration error. Please contact support.');
    });
  });

  describe('API Route → Name Flow (with OPENAI_API_KEY set)', () => {
    beforeEach(() => {
      vi.resetModules();
      // Set a fake API key so the route doesn't short-circuit
      process.env.OPENAI_API_KEY = 'sk-test-fake-key-for-testing';
    });

    afterEach(() => {
      delete process.env.OPENAI_API_KEY;
      vi.restoreAllMocks();
    });

    it('should handle name flow: new session → awaiting_name → welcome greeting', async () => {
      const { POST } = await import('@/app/api/chat/route');

      // First message (name capture)
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Rahul' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.sessionId).toBeDefined();
      expect(data.reply).toContain('Welcome to Saltystaz Gurgaon');
      expect(data.reply).toContain('Rahul');
    });

    it('should reject empty messages with 400', async () => {
      const { POST } = await import('@/app/api/chat/route');

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '   ' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Please enter a message');
    });

    it('should reject messages over 1000 characters with 400', async () => {
      const { POST } = await import('@/app/api/chat/route');

      const longMessage = 'a'.repeat(1001);
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: longMessage }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Message too long');
    });
  });

  describe('Module Import Wiring Verification', () => {
    it('should verify all modules are importable and export expected interfaces', async () => {
      // Session Manager
      const sm = await import('@/lib/session-manager');
      expect(sm.sessionManager).toBeDefined();
      expect(sm.sessionManager.createSession).toBeInstanceOf(Function);
      expect(sm.sessionManager.getSession).toBeInstanceOf(Function);
      expect(sm.sessionManager.isExpired).toBeInstanceOf(Function);
      expect(sm.sessionManager.addMessage).toBeInstanceOf(Function);
      expect(sm.sessionManager.clearSession).toBeInstanceOf(Function);

      // Booking Engine
      const be = await import('@/lib/booking-engine');
      expect(be.bookingEngine).toBeDefined();
      expect(be.bookingEngine.checkAvailability).toBeInstanceOf(Function);
      expect(be.bookingEngine.createBooking).toBeInstanceOf(Function);
      expect(be.bookingEngine.cancelBooking).toBeInstanceOf(Function);
      expect(be.bookingEngine.validateDates).toBeInstanceOf(Function);

      // FAQ Module
      const faq = await import('@/lib/faq-module');
      expect(faq.faqModule).toBeDefined();
      expect(faq.faqModule.getHotelInfo).toBeInstanceOf(Function);
      expect(faq.faqModule.getCheckInTime).toBeInstanceOf(Function);
      expect(faq.faqModule.getCheckOutTime).toBeInstanceOf(Function);
      expect(faq.faqModule.getAmenities).toBeInstanceOf(Function);
      expect(faq.faqModule.getPolicy).toBeInstanceOf(Function);
      expect(faq.faqModule.getRoomPricing).toBeInstanceOf(Function);

      // Mock Data Store
      const mds = await import('@/lib/mock-data');
      expect(mds.mockDataStore).toBeDefined();
      expect(mds.mockDataStore.getRoomTypes).toBeInstanceOf(Function);
      expect(mds.mockDataStore.getAvailability).toBeInstanceOf(Function);
      expect(mds.mockDataStore.getPolicies).toBeInstanceOf(Function);
      expect(mds.mockDataStore.getAmenities).toBeInstanceOf(Function);

      // Validation
      const val = await import('@/lib/validation');
      expect(val.validateMessage).toBeInstanceOf(Function);
      expect(val.validateDates).toBeInstanceOf(Function);

      // Hotel Agent
      const ha = await import('@/lib/hotel-agent');
      expect(ha.hotelAgent).toBeDefined();
      expect(ha.runHotelAgent).toBeInstanceOf(Function);
    });
  });
});
