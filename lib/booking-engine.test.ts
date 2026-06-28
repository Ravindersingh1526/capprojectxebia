import { describe, it, expect, beforeEach } from 'vitest';
import { bookingEngine } from '@/lib/booking-engine';
import { mockDataStore } from '@/lib/mock-data';

// Helper to get a date string N days from today
function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

describe('BookingEngine', () => {
  beforeEach(() => {
    // Reinitialize mock data store before each test to reset state
    mockDataStore.initialize();
  });

  describe('validateDates', () => {
    it('delegates to validation utility and returns valid result for good dates', () => {
      const result = bookingEngine.validateDates(daysFromNow(1), daysFromNow(3));
      expect(result.valid).toBe(true);
    });

    it('returns invalid for check-in in the past', () => {
      const result = bookingEngine.validateDates('2020-01-01', daysFromNow(3));
      expect(result.valid).toBe(false);
      expect(result.error).toBe('checkin_in_past');
    });

    it('returns invalid for checkout before checkin', () => {
      const result = bookingEngine.validateDates(daysFromNow(5), daysFromNow(2));
      expect(result.valid).toBe(false);
      expect(result.error).toBe('checkout_before_checkin');
    });
  });

  describe('checkAvailability', () => {
    it('returns available rooms for valid dates', () => {
      const checkIn = daysFromNow(1);
      const checkOut = daysFromNow(3);
      const results = bookingEngine.checkAvailability(checkIn, checkOut);

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('returns results with correct structure', () => {
      const checkIn = daysFromNow(1);
      const checkOut = daysFromNow(3);
      const results = bookingEngine.checkAvailability(checkIn, checkOut);

      for (const room of results) {
        expect(room).toHaveProperty('roomTypeId');
        expect(room).toHaveProperty('name');
        expect(room).toHaveProperty('pricePerNight');
        expect(room).toHaveProperty('totalCost');
        expect(room).toHaveProperty('maxGuests');
        expect(room.totalCost).toBe(room.pricePerNight * 2); // 2 nights
      }
    });

    it('filters by room type when specified', () => {
      const checkIn = daysFromNow(1);
      const checkOut = daysFromNow(3);
      const results = bookingEngine.checkAvailability(checkIn, checkOut, 'deluxe-room');

      expect(results.length).toBe(1);
      expect(results[0].roomTypeId).toBe('deluxe-room');
    });

    it('returns at most 3 options', () => {
      const checkIn = daysFromNow(1);
      const checkOut = daysFromNow(3);
      const results = bookingEngine.checkAvailability(checkIn, checkOut);

      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('returns empty array when no rooms are available', () => {
      // Exhaust availability for deluxe-room on a specific date
      const date = daysFromNow(1);
      for (let i = 0; i < 10; i++) {
        mockDataStore.decrementAvailability('deluxe-room', date);
      }

      const results = bookingEngine.checkAvailability(date, daysFromNow(2), 'deluxe-room');
      expect(results).toHaveLength(0);
    });

    it('calculates total cost correctly based on number of nights', () => {
      const checkIn = daysFromNow(1);
      const checkOut = daysFromNow(5); // 4 nights
      const results = bookingEngine.checkAvailability(checkIn, checkOut, 'deluxe-room');

      expect(results.length).toBe(1);
      expect(results[0].totalCost).toBe(results[0].pricePerNight * 4);
    });
  });

  describe('createBooking', () => {
    it('creates a booking with valid request', () => {
      const request = {
        checkInDate: daysFromNow(1),
        checkOutDate: daysFromNow(3),
        roomType: 'deluxe-room',
        guestName: 'John Doe',
      };

      const confirmation = bookingEngine.createBooking(request, 'session-123');

      expect(confirmation.confirmationNumber).toMatch(/^STZ-\d{8}-\d{3}$/);
      expect(confirmation.roomType).toBe('deluxe-room');
      expect(confirmation.checkInDate).toBe(request.checkInDate);
      expect(confirmation.checkOutDate).toBe(request.checkOutDate);
      expect(confirmation.guestName).toBe('John Doe');
      expect(confirmation.pricePerNight).toBe(8500);
      expect(confirmation.totalCost).toBe(17000); // 2 nights × 8500
    });

    it('generates confirmation number with check-in date', () => {
      const checkIn = daysFromNow(5);
      const request = {
        checkInDate: checkIn,
        checkOutDate: daysFromNow(7),
        roomType: 'deluxe-room',
        guestName: 'Test Guest',
      };

      const confirmation = bookingEngine.createBooking(request, 'session-1');
      const expectedDatePart = checkIn.replace(/-/g, '');
      expect(confirmation.confirmationNumber).toContain(expectedDatePart);
    });

    it('decrements availability for each reserved date', () => {
      const checkIn = daysFromNow(1);
      const checkOut = daysFromNow(3);
      const day1 = checkIn;
      const day2 = daysFromNow(2);

      const availBefore1 = mockDataStore.getAvailability('deluxe-room', day1);
      const availBefore2 = mockDataStore.getAvailability('deluxe-room', day2);

      bookingEngine.createBooking(
        { checkInDate: checkIn, checkOutDate: checkOut, roomType: 'deluxe-room', guestName: 'Test' },
        'session-1'
      );

      const availAfter1 = mockDataStore.getAvailability('deluxe-room', day1);
      const availAfter2 = mockDataStore.getAvailability('deluxe-room', day2);

      expect(availAfter1).toBe(availBefore1 - 1);
      expect(availAfter2).toBe(availBefore2 - 1);
    });

    it('throws error for invalid dates', () => {
      const request = {
        checkInDate: '2020-01-01',
        checkOutDate: daysFromNow(3),
        roomType: 'deluxe-room',
        guestName: 'Test',
      };

      expect(() => bookingEngine.createBooking(request, 'session-1')).toThrow();
    });

    it('throws error when room type is not available', () => {
      // Exhaust all deluxe-room availability
      const date = daysFromNow(1);
      for (let i = 0; i < 10; i++) {
        mockDataStore.decrementAvailability('deluxe-room', date);
      }

      const request = {
        checkInDate: date,
        checkOutDate: daysFromNow(2),
        roomType: 'deluxe-room',
        guestName: 'Test',
      };

      expect(() => bookingEngine.createBooking(request, 'session-1')).toThrow(
        /no availability/i
      );
    });
  });

  describe('cancelBooking', () => {
    it('successfully cancels a booking within the same session', () => {
      const request = {
        checkInDate: daysFromNow(1),
        checkOutDate: daysFromNow(3),
        roomType: 'executive-suite',
        guestName: 'Cancel Test',
      };

      const confirmation = bookingEngine.createBooking(request, 'session-cancel');
      const result = bookingEngine.cancelBooking(confirmation.confirmationNumber, 'session-cancel');

      expect(result).toBe(true);
    });

    it('restores availability after cancellation', () => {
      const checkIn = daysFromNow(1);
      const checkOut = daysFromNow(3);

      const availBefore = mockDataStore.getAvailability('executive-suite', checkIn);

      const confirmation = bookingEngine.createBooking(
        { checkInDate: checkIn, checkOutDate: checkOut, roomType: 'executive-suite', guestName: 'Test' },
        'session-restore'
      );

      // After booking, availability should be decremented
      expect(mockDataStore.getAvailability('executive-suite', checkIn)).toBe(availBefore - 1);

      // Cancel
      bookingEngine.cancelBooking(confirmation.confirmationNumber, 'session-restore');

      // Availability should be restored
      expect(mockDataStore.getAvailability('executive-suite', checkIn)).toBe(availBefore);
    });

    it('returns false for non-existent confirmation number', () => {
      const result = bookingEngine.cancelBooking('STZ-99999999-999', 'session-1');
      expect(result).toBe(false);
    });

    it('returns false when session does not match', () => {
      const confirmation = bookingEngine.createBooking(
        {
          checkInDate: daysFromNow(1),
          checkOutDate: daysFromNow(3),
          roomType: 'deluxe-room',
          guestName: 'Test',
        },
        'session-owner'
      );

      const result = bookingEngine.cancelBooking(confirmation.confirmationNumber, 'different-session');
      expect(result).toBe(false);
    });

    it('returns false when booking is already cancelled', () => {
      const confirmation = bookingEngine.createBooking(
        {
          checkInDate: daysFromNow(4),
          checkOutDate: daysFromNow(6),
          roomType: 'deluxe-room',
          guestName: 'Test',
        },
        'session-double-cancel'
      );

      bookingEngine.cancelBooking(confirmation.confirmationNumber, 'session-double-cancel');
      const result = bookingEngine.cancelBooking(confirmation.confirmationNumber, 'session-double-cancel');
      expect(result).toBe(false);
    });
  });
});
