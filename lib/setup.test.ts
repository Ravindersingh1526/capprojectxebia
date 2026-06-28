import { describe, it, expect } from 'vitest';

describe('Project Setup', () => {
  it('should have vitest configured correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should resolve path aliases', async () => {
    // Verify that the @/ alias resolves correctly
    const pkg = await import('@/package.json');
    expect(pkg.name).toBe('hotel-chat');
  });
});
