import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { bookingEngine } from '@/lib/booking-engine';
import { mockDataStore } from '@/lib/mock-data';

/**
 * Property 5: Availability results are capped at 3 options
 *
 * For any availability query against the Mock Data Store, regardless of how many
 * room types have available units, the returned results SHALL contain at most
 * 3 room options.
 *
 * Validates: Requirements 3.3
 */
describe('Feature: hotel-ai-chat-assistant, Property 5: Availability results capped at 3', () => {
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

  it('checkAvailability returns at most 3 room options for any valid date range and optional room type filter', () => {
    const roomTypeIds = ['deluxe-room', 'executive-suite', 'presidential-suite'];

    fc.assert(
      fc.property(
        // Generate check-in day offset: 0 to 25 days from today (leaves room for check-out within 30-day window)
        fc.integer({ min: 0, max: 25 }),
        // Generate stay duration: 1 to 5 nights
        fc.integer({ min: 1, max: 5 }),
        // Optionally filter by room type (undefined means no filter)
        fc.option(fc.constantFrom(...roomTypeIds), { nil: undefined }),
        (checkInOffset, stayDuration, roomType) => {
          // Re-initialize store for each run to ensure clean state
          mockDataStore.initialize();

          const checkInDate = getDateString(checkInOffset);
          const checkOutDate = getDateString(checkInOffset + stayDuration);

          const results = bookingEngine.checkAvailability(checkInDate, checkOutDate, roomType);

          // The results must always be at most 3
          expect(results.length).toBeLessThanOrEqual(3);
        }
      ),
      { numRuns: 100, seed: Date.now(), verbose: true }
    );
  });

  it('checkAvailability returns at most 3 options when no room type filter is applied', () => {
    fc.assert(
      fc.property(
        // Generate check-in day offset: 0 to 25 days from today
        fc.integer({ min: 0, max: 25 }),
        // Generate stay duration: 1 to 5 nights
        fc.integer({ min: 1, max: 5 }),
        (checkInOffset, stayDuration) => {
          // Re-initialize store for each run to ensure clean state
          mockDataStore.initialize();

          const checkInDate = getDateString(checkInOffset);
          const checkOutDate = getDateString(checkInOffset + stayDuration);

          // Explicitly pass no room type filter to get all available rooms
          const results = bookingEngine.checkAvailability(checkInDate, checkOutDate);

          // Regardless of how many room types exist with availability, results must be <= 3
          expect(results.length).toBeLessThanOrEqual(3);
        }
      ),
      { numRuns: 100, seed: Date.now(), verbose: true }
    );
  });
});
