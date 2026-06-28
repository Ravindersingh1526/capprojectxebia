import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateMessage } from '@/lib/validation';

/**
 * Property 3: Whitespace-only messages are rejected
 *
 * For any string composed entirely of whitespace characters (spaces, tabs, newlines, or empty string),
 * the message validation function SHALL reject the message and return an error indicating the guest
 * should enter a valid message.
 *
 * **Validates: Requirements 1.6**
 */
describe('Feature: hotel-ai-chat-assistant, Property 3: Whitespace-only messages rejected', () => {
  const fcConfig = { numRuns: 100, seed: Date.now(), verbose: true };

  // Generator for whitespace-only strings (including empty string)
  const whitespaceArb = fc
    .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 50 })
    .map((chars) => chars.join(''));

  it('rejects any whitespace-only string (including empty string)', () => {
    fc.assert(
      fc.property(whitespaceArb, (whitespaceString) => {
        const result = validateMessage(whitespaceString);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Please enter a message');
      }),
      fcConfig,
    );
  });

  it('accepts any non-empty string containing at least one non-whitespace character (length ≤ 1000)', () => {
    // Generate a string with at least one non-whitespace character, total length ≤ 1000
    const validMessageArb = fc
      .tuple(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 }).map((c) => c.join('')),
        fc.string({ minLength: 1, maxLength: 1 }).filter((s) => s.trim().length > 0),
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 }).map((c) => c.join('')),
      )
      .map(([prefix, nonWs, suffix]) => prefix + nonWs + suffix)
      .filter((s) => s.length <= 1000);

    fc.assert(
      fc.property(validMessageArb, (validString) => {
        const result = validateMessage(validString);
        expect(result.valid).toBe(true);
      }),
      fcConfig,
    );
  });
});
