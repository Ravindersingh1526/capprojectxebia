import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataStore } from '@/lib/mock-data';
import type { BookingRecord } from '@/lib/types';

describe('MockDataStore', () => {
  beforeEach(() => {
    mockDataStore.initialize();
  });

  describe('getRoomTypes', () => {
    it('returns at least 3 distinct room types', () => {
      const roomTypes = mockDataStore.getRoomTypes();
      expect(roomTypes.length).toBeGreaterThanOrEqual(3);

      const names = roomTypes.map((r) => r.name);
      expect(new Set(names).size).toBe(roomTypes.length);
    });

    it('each room type has non-empty name, description, amenities, valid maxGuests and positive rate', () => {
      const roomTypes = mockDataStore.getRoomTypes();
      for (const room of roomTypes) {
        expect(room.name.trim().length).toBeGreaterThan(0);
        expect(room.description.trim().length).toBeGreaterThan(0);
        expect(room.maxGuests).toBeGreaterThanOrEqual(1);
        expect(room.maxGuests).toBeLessThanOrEqual(10);
        expect(room.pricePerNight).toBeGreaterThan(0);
        expect(room.amenities.length).toBeGreaterThan(0);
      }
    });

    it('contains Deluxe Room, Executive Suite, and Presidential Suite', () => {
      const names = mockDataStore.getRoomTypes().map((r) => r.name);
      expect(names).toContain('Deluxe Room');
      expect(names).toContain('Executive Suite');
      expect(names).toContain('Presidential Suite');
    });
  });

  describe('getAvailability', () => {
    it('returns positive availability for each room type for 30 days from today', () => {
      const roomTypes = mockDataStore.getRoomTypes();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const room of roomTypes) {
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          const avail = mockDataStore.getAvailability(room.id, dateStr);
          expect(avail).toBeGreaterThan(0);
        }
      }
    });

    it('returns 0 for unknown room type', () => {
      expect(mockDataStore.getAvailability('unknown', '2025-01-01')).toBe(0);
    });

    it('returns 0 for date not in range', () => {
      const roomTypes = mockDataStore.getRoomTypes();
      expect(mockDataStore.getAvailability(roomTypes[0].id, '1990-01-01')).toBe(0);
    });
  });

  describe('decrementAvailability', () => {
    it('returns true and decrements when availability > 0', () => {
      const room = mockDataStore.getRoomTypes()[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateStr = today.toISOString().split('T')[0];

      const before = mockDataStore.getAvailability(room.id, dateStr);
      const result = mockDataStore.decrementAvailability(room.id, dateStr);

      expect(result).toBe(true);
      expect(mockDataStore.getAvailability(room.id, dateStr)).toBe(before - 1);
    });

    it('returns false when availability would go below 0', () => {
      const room = mockDataStore.getRoomTypes()[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateStr = today.toISOString().split('T')[0];

      const initial = mockDataStore.getAvailability(room.id, dateStr);
      for (let i = 0; i < initial; i++) {
        mockDataStore.decrementAvailability(room.id, dateStr);
      }

      const result = mockDataStore.decrementAvailability(room.id, dateStr);
      expect(result).toBe(false);
      expect(mockDataStore.getAvailability(room.id, dateStr)).toBe(0);
    });

    it('returns false for unknown room type', () => {
      expect(mockDataStore.decrementAvailability('unknown', '2025-01-01')).toBe(false);
    });
  });

  describe('incrementAvailability', () => {
    it('increments availability for a given room type and date', () => {
      const room = mockDataStore.getRoomTypes()[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateStr = today.toISOString().split('T')[0];

      const before = mockDataStore.getAvailability(room.id, dateStr);
      mockDataStore.incrementAvailability(room.id, dateStr);
      expect(mockDataStore.getAvailability(room.id, dateStr)).toBe(before + 1);
    });
  });

  describe('getPolicies', () => {
    it('returns policies with all required fields as non-empty text', () => {
      const policies = mockDataStore.getPolicies();
      expect(policies.checkInTime.trim().length).toBeGreaterThan(0);
      expect(policies.checkOutTime.trim().length).toBeGreaterThan(0);
      expect(policies.cancellation.trim().length).toBeGreaterThan(0);
      expect(policies.pets.trim().length).toBeGreaterThan(0);
      expect(policies.smoking.trim().length).toBeGreaterThan(0);
      expect(policies.parking.trim().length).toBeGreaterThan(0);
    });

    it('has correct check-in and check-out times', () => {
      const policies = mockDataStore.getPolicies();
      expect(policies.checkInTime).toBe('2:00 PM');
      expect(policies.checkOutTime).toBe('12:00 PM');
    });
  });

  describe('getAmenities', () => {
    it('returns at least 5 amenities', () => {
      const amenities = mockDataStore.getAmenities();
      expect(amenities.length).toBeGreaterThanOrEqual(5);
    });

    it('each amenity has non-empty name and description', () => {
      const amenities = mockDataStore.getAmenities();
      for (const amenity of amenities) {
        expect(amenity.name.trim().length).toBeGreaterThan(0);
        expect(amenity.description.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('addBooking', () => {
    it('adds a booking record', () => {
      const booking: BookingRecord = {
        confirmationNumber: 'STZ-20250101-001',
        sessionId: 'session-1',
        guestName: 'Test Guest',
        roomType: 'deluxe-room',
        checkInDate: '2025-07-20',
        checkOutDate: '2025-07-22',
        pricePerNight: 8500,
        totalCost: 17000,
        status: 'confirmed',
        createdAt: new Date(),
      };

      mockDataStore.addBooking(booking);
      // Verify cancellation works on it (proves it was stored)
      expect(mockDataStore.cancelBooking('STZ-20250101-001')).toBe(true);
    });
  });

  describe('cancelBooking', () => {
    it('returns true and marks booking as cancelled when found', () => {
      const booking: BookingRecord = {
        confirmationNumber: 'STZ-20250715-002',
        sessionId: 'session-2',
        guestName: 'Cancel Guest',
        roomType: 'executive-suite',
        checkInDate: '2025-07-25',
        checkOutDate: '2025-07-27',
        pricePerNight: 15000,
        totalCost: 30000,
        status: 'confirmed',
        createdAt: new Date(),
      };

      mockDataStore.addBooking(booking);
      const result = mockDataStore.cancelBooking('STZ-20250715-002');
      expect(result).toBe(true);
    });

    it('returns false when booking not found', () => {
      const result = mockDataStore.cancelBooking('NON-EXISTENT');
      expect(result).toBe(false);
    });
  });
});
