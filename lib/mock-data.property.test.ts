import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { mockDataStore } from '@/lib/mock-data';
import type { BookingRecord } from '@/lib/types';

/**
 * Property 6: Booking creation produces a valid record and decrements availability
 *
 * For any valid booking request (valid dates, available room type), calling
 * decrementAvailability() for each date in the range and addBooking() SHALL
 * result in availability decremented by exactly 1 for each date, and the
 * booking SHALL be retrievable (provable via cancelBooking).
 *
 * Validates: Requirements 3.4, 5.6
 */
describe('Feature: hotel-ai-chat-assistant, Property 6: Booking creation valid record and decrement', () => {
  beforeEach(() => {
    mockDataStore.initialize();
  });

  /**
   * Helper: generate a date string offset from today
   */
  function getDateString(daysFromToday: number): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + daysFromToday);
    return date.toISOString().split('T')[0];
  }

  /**
   * Helper: get all dates in a range [checkIn, checkOut) as strings
   */
  function getDatesInRange(checkIn: string, checkOut: string): string[] {
    const dates: string[] = [];
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const current = new Date(start);
    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  it('decrementAvailability reduces availability by exactly 1 for each date in the booking range, and addBooking stores the record', () => {
    const roomTypeIds = ['deluxe-room', 'executive-suite', 'presidential-suite'];

    fc.assert(
      fc.property(
        // Generate check-in day offset: 0 to 25 days from today (leaves room for check-out within 30 days)
        fc.integer({ min: 0, max: 25 }),
        // Generate stay duration: 1 to 4 nights
        fc.integer({ min: 1, max: 4 }),
        // Pick a random room type index
        fc.integer({ min: 0, max: roomTypeIds.length - 1 }),
        // Generate a random confirmation number suffix
        fc.integer({ min: 1, max: 999 }),
        (checkInOffset, stayDuration, roomTypeIndex, confirmationSuffix) => {
          // Re-initialize store for each run to ensure clean state
          mockDataStore.initialize();

          const roomTypeId = roomTypeIds[roomTypeIndex];
          const checkInDate = getDateString(checkInOffset);
          const checkOutDate = getDateString(checkInOffset + stayDuration);
          const datesInRange = getDatesInRange(checkInDate, checkOutDate);

          // Record availability before booking
          const availabilityBefore: Map<string, number> = new Map();
          for (const date of datesInRange) {
            availabilityBefore.set(date, mockDataStore.getAvailability(roomTypeId, date));
          }

          // Ensure all dates have availability > 0
          for (const date of datesInRange) {
            const avail = availabilityBefore.get(date)!;
            if (avail <= 0) {
              // Skip this test case if no availability (shouldn't happen with fresh store)
              return;
            }
          }

          // Decrement availability for each date in range
          for (const date of datesInRange) {
            const result = mockDataStore.decrementAvailability(roomTypeId, date);
            expect(result).toBe(true);
          }

          // Verify availability decremented by exactly 1 for each date
          for (const date of datesInRange) {
            const availAfter = mockDataStore.getAvailability(roomTypeId, date);
            const availBefore = availabilityBefore.get(date)!;
            expect(availAfter).toBe(availBefore - 1);
          }

          // Create and add booking record
          const roomTypes = mockDataStore.getRoomTypes();
          const roomType = roomTypes.find(rt => rt.id === roomTypeId)!;
          const confirmationNumber = `STZ-${checkInDate.replace(/-/g, '')}-${String(confirmationSuffix).padStart(3, '0')}`;

          const booking: BookingRecord = {
            confirmationNumber,
            sessionId: 'test-session-001',
            guestName: 'Test Guest',
            roomType: roomTypeId,
            checkInDate,
            checkOutDate,
            pricePerNight: roomType.pricePerNight,
            totalCost: roomType.pricePerNight * stayDuration,
            status: 'confirmed',
            createdAt: new Date(),
          };

          mockDataStore.addBooking(booking);

          // Verify the booking was stored by cancelling it (proves retrieval)
          const cancelResult = mockDataStore.cancelBooking(confirmationNumber);
          expect(cancelResult).toBe(true);
        }
      ),
      { numRuns: 100, seed: Date.now(), verbose: true }
    );
  });
});
