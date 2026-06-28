import { DateValidationResult } from '@/lib/types';

/**
 * Validates a chat message input.
 * Rejects empty strings, whitespace-only strings, and messages exceeding 1000 characters.
 */
export function validateMessage(message: string): { valid: boolean; error?: string } {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Please enter a message' };
  }

  if (message.length > 1000) {
    return { valid: false, error: 'Message too long. Please keep it under 1000 characters.' };
  }

  return { valid: true };
}

/**
 * Validates a ISO date string format (YYYY-MM-DD).
 * Returns true if the string matches the format and represents a valid date.
 */
function isValidISODate(dateStr: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateStr)) {
    return false;
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Validates check-in and check-out dates for a booking.
 * Checks ISO format, past dates, and date ordering.
 */
export function validateDates(checkIn: string, checkOut: string): DateValidationResult {
  // Validate format first
  if (!isValidISODate(checkIn) || !isValidISODate(checkOut)) {
    return {
      valid: false,
      error: 'invalid_format',
      message: 'Invalid date format. Please use YYYY-MM-DD.',
    };
  }

  // Check if check-in is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkInDate = new Date(checkIn + 'T00:00:00');
  if (checkInDate < today) {
    return {
      valid: false,
      error: 'checkin_in_past',
      message: 'Check-in date cannot be in the past. Please select a future date.',
    };
  }

  // Check if check-out is after check-in
  const checkOutDate = new Date(checkOut + 'T00:00:00');
  if (checkOutDate <= checkInDate) {
    return {
      valid: false,
      error: 'checkout_before_checkin',
      message: 'Check-out date must be after check-in date.',
    };
  }

  return { valid: true };
}
