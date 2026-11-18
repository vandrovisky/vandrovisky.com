import { expect, test } from 'vitest';
import { hasFinePointer, prefersReducedMotion } from '../../src/scripts/motion/env';

test('without matchMedia: motion allowed, no fine pointer (so no custom cursor)', () => {
  expect(prefersReducedMotion()).toBe(false);
  expect(hasFinePointer()).toBe(false);
});
