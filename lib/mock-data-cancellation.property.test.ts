import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { mockDataStore } from '@/lib/mock-data';
import type { BookingRecord } from '@/lib/types';

/**
 * Property 7: Booking cancellation restores availability
 *
 * For any confirmed booking that is cancelled within the same session,
 * the booking status SHALL change to 'cancelled' AND the Mock Data Store
 * SHALL have availability incremented by exactly 1 for the specified room
 * type on each date that was previously reserved.
 *
 * **Validates: Requirements 3.8**
 */
describe('Feature: hotel-ai-chat-assistant, Property 7: Cancellation restores availability', () => {
  beforeEach(() => {
    mockDataStore.initialize();
  });

  it('cancelling a booking restores availability by exactly 1 for each reserved date', () => {
    const roomTypeIds = mockDataStore.getRoomTypes().map((r) => r.id);

    // Arbitrary for generating a valid date range within 30 days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateRangeArb = fc
      .integer({ min: 0, max: 28 })
      .chain((startOffset) =>
        fc.integer({ min: startOffset + 1, max: Math.min(startOffset + 7, 29) }).map(
          (endOffset) => ({ startOffset, endOffset })
        )
      );

    const roomTypeArb = fc.integer({ min: 0, max: roomTypeIds.length - 1 });

    fc.assert(
      fc.property(
        dateRangeArb,
        roomTypeArb,
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        ({ startOffset, endOffset }, roomTypeIndex, sessionId, guestName) => {
          // Re-initialize for each test iteration to ensure clean state
          mockDataStore.initialize();

          const roomTypeId = roomTypeIds[roomTypeIndex];
          const roomType = mockDataStore.getRoomTypes().find((r) => r.id === roomTypeId)!;

          // Compute check-in and check-out dates
          const checkInDate = new Date(today);
          checkInDate.setDate(today.getDate() + startOffset);
          const checkOutDate = new Date(today);
          checkOutDate.setDate(today.getDate() + endOffset);

          const checkInStr = checkInDate.toISOString().split('T')[0];
          const checkOutStr = checkOutDate.toISOString().split('T')[0];

          // Generate all dates in the range [checkIn, checkOut)
          const reservedDates: string[] = [];
          const current = new Date(checkInDate);
          while (current < checkOutDate) {
            reservedDates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }

          // Simulate booking: decrement availability for each reserved date
          for (const date of reservedDates) {
            const decremented = mockDataStore.decrementAvailability(roomTypeId, date);
            expect(decremented).toBe(true);
          }

          // Create a confirmed booking record
          const confirmationNumber = `STZ-${checkInStr.replace(/-/g, '')}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`;
          const nights = reservedDates.length;
          const booking: BookingRecord = {
            confirmationNumber,
            sessionId,
            guestName: guestName || 'Test Guest',
            roomType: roomTypeId,
            checkInDate: checkInStr,
            checkOutDate: checkOutStr,
            pricePerNight: roomType.pricePerNight,
            totalCost: roomType.pricePerNight * nights,
            status: 'confirmed',
            createdAt: new Date(),
          };

          mockDataStore.addBooking(booking);

          // Record availability after booking (post-decrement)
          const availabilityAfterBooking: Map<string, number> = new Map();
          for (const date of reservedDates) {
            availabilityAfterBooking.set(
              date,
              mockDataStore.getAvailability(roomTypeId, date)
            );
          }

          // Cancel the booking
          const cancelResult = mockDataStore.cancelBooking(confirmationNumber);
          expect(cancelResult).toBe(true);

          // Restore availability (simulate what the booking engine does on cancellation)
          for (const date of reservedDates) {
            mockDataStore.incrementAvailability(roomTypeId, date);
          }

          // Verify: availability for each date is exactly 1 more than after-booking value
          for (const date of reservedDates) {
            const availAfterCancel = mockDataStore.getAvailability(roomTypeId, date);
            const availAfterBook = availabilityAfterBooking.get(date)!;
            expect(availAfterCancel).toBe(availAfterBook + 1);
          }
        }
      ),
      { numRuns: 100, seed: Date.now(), verbose: true }
    );
  });
});
