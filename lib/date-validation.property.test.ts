import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateDates } from '@/lib/validation';

/**
 * Property 4: Date validation rejects invalid booking dates
 *
 * For any pair of dates where the check-out date is on or before the check-in date,
 * OR the check-in date is before today's date, the date validation function SHALL return
 * an invalid result with the appropriate error type (`checkout_before_checkin` or `checkin_in_past`).
 *
 * **Validates: Requirements 3.6, 3.7**
 */
describe('Feature: hotel-ai-chat-assistant, Property 4: Date validation rejects invalid dates', () => {
  const fcConfig = { numRuns: 100, seed: Date.now(), verbose: true };

  /**
   * Helper to format a Date object as an ISO date string (YYYY-MM-DD).
   */
  function toISODateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Test 1 — checkin_in_past property:
   * Generate a random number of days in the past (1 to 365).
   * Generate check-out offset that is after check-in (valid ordering).
   * Call validateDates(pastCheckIn, validCheckOut).
   * Verify: result.valid === false AND result.error === 'checkin_in_past'
   */
  it('rejects check-in dates in the past with checkin_in_past error', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }), // days in the past for check-in
        fc.integer({ min: 1, max: 30 }),   // check-out offset after check-in (valid ordering)
        (daysInPast, checkOutOffset) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const checkInDate = new Date(today);
          checkInDate.setDate(checkInDate.getDate() - daysInPast);

          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkOutDate.getDate() + checkOutOffset);

          const checkIn = toISODateString(checkInDate);
          const checkOut = toISODateString(checkOutDate);

          const result = validateDates(checkIn, checkOut);

          expect(result.valid).toBe(false);
          expect(result.error).toBe('checkin_in_past');
        },
      ),
      fcConfig,
    );
  });

  /**
   * Test 2 — checkout_before_checkin property:
   * Generate a valid check-in date (today or future, 0 to 25 days from now).
   * Generate check-out that is on or before check-in (same day or earlier).
   * Call validateDates(checkIn, invalidCheckOut).
   * Verify: result.valid === false AND result.error === 'checkout_before_checkin'
   */
  it('rejects check-out on or before check-in with checkout_before_checkin error', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 25 }), // days from now for check-in
        fc.integer({ min: 0, max: 25 }), // days to subtract from check-in for check-out (0 = same day)
        (checkInOffset, checkOutSubtract) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const checkInDate = new Date(today);
          checkInDate.setDate(checkInDate.getDate() + checkInOffset);

          // Check-out is on or before check-in
          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkOutDate.getDate() - checkOutSubtract);

          const checkIn = toISODateString(checkInDate);
          const checkOut = toISODateString(checkOutDate);

          const result = validateDates(checkIn, checkOut);

          expect(result.valid).toBe(false);
          expect(result.error).toBe('checkout_before_checkin');
        },
      ),
      fcConfig,
    );
  });

  /**
   * Test 3 — valid dates are accepted:
   * Generate check-in 0-25 days from now.
   * Generate check-out 1-5 days after check-in.
   * Call validateDates(validCheckIn, validCheckOut).
   * Verify: result.valid === true
   */
  it('accepts valid date pairs (check-in today or future, check-out after check-in)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 25 }), // days from now for check-in
        fc.integer({ min: 1, max: 5 }),   // days after check-in for check-out
        (checkInOffset, checkOutOffset) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const checkInDate = new Date(today);
          checkInDate.setDate(checkInDate.getDate() + checkInOffset);

          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkOutDate.getDate() + checkOutOffset);

          const checkIn = toISODateString(checkInDate);
          const checkOut = toISODateString(checkOutDate);

          const result = validateDates(checkIn, checkOut);

          expect(result.valid).toBe(true);
        },
      ),
      fcConfig,
    );
  });
});
