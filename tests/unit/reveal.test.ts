import { expect, test } from 'vitest';
import { REVEAL_OPTIONS } from '../../src/scripts/motion/reveal';

test('sections taller than the viewport can still trigger the reveal', () => {
  // a ratio threshold > 0 is unreachable for elements taller than viewport / threshold
  expect(REVEAL_OPTIONS.threshold).toBe(0);
  expect(REVEAL_OPTIONS.rootMargin).toMatch(/^0px 0px -\d+% 0px$/);
});
