import { describe, it, expect } from 'vitest';
import { validateMessage, validateDates } from '@/lib/validation';

describe('validateMessage', () => {
  it('rejects an empty string', () => {
    const result = validateMessage('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Please enter a message');
  });

  it('rejects a whitespace-only string', () => {
    const result = validateMessage('   \t\n  ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Please enter a message');
  });

  it('rejects a message longer than 1000 characters', () => {
    const longMessage = 'a'.repeat(1001);
    const result = validateMessage(longMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Message too long. Please keep it under 1000 characters.');
  });

  it('accepts a valid message', () => {
    const result = validateMessage('Hello, I would like to book a room.');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts a message at exactly 1000 characters', () => {
    const result = validateMessage('a'.repeat(1000));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('validateDates', () => {
  // Helper to get a date string N days from today
  function daysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  it('rejects invalid date format (not YYYY-MM-DD)', () => {
    const result = validateDates('01-15-2025', '01-20-2025');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_format');
    expect(result.message).toBe('Invalid date format. Please use YYYY-MM-DD.');
  });

  it('rejects invalid date values (e.g., month 13)', () => {
    const result = validateDates('2025-13-01', '2025-14-01');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_format');
  });

  it('rejects invalid date values (e.g., Feb 30)', () => {
    const result = validateDates('2025-02-30', '2025-03-05');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_format');
  });

  it('rejects check-in date in the past', () => {
    const result = validateDates('2020-01-01', daysFromNow(5));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('checkin_in_past');
    expect(result.message).toBe('Check-in date cannot be in the past. Please select a future date.');
  });

  it('rejects check-out on same day as check-in', () => {
    const sameDay = daysFromNow(3);
    const result = validateDates(sameDay, sameDay);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('checkout_before_checkin');
    expect(result.message).toBe('Check-out date must be after check-in date.');
  });

  it('rejects check-out before check-in', () => {
    const result = validateDates(daysFromNow(5), daysFromNow(3));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('checkout_before_checkin');
    expect(result.message).toBe('Check-out date must be after check-in date.');
  });

  it('accepts valid dates (check-in today, check-out tomorrow)', () => {
    const result = validateDates(daysFromNow(0), daysFromNow(1));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.message).toBeUndefined();
  });

  it('accepts valid future dates', () => {
    const result = validateDates(daysFromNow(10), daysFromNow(15));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
