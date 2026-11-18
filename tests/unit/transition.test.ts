import { expect, test } from 'vitest';
import { decodeOrigin, encodeOrigin } from '../../src/scripts/motion/transition';

test('round trip within the max age', () => {
  expect(decodeOrigin(encodeOrigin(10, 20, 1000), 1500)).toEqual({ x: 10, y: 20 });
});
test('stale origin is ignored', () => {
  expect(decodeOrigin(encodeOrigin(10, 20, 0), 5000)).toBeNull();
});
test('custom max age', () => {
  expect(decodeOrigin(encodeOrigin(1, 2, 0), 5000, 10_000)).toEqual({ x: 1, y: 2 });
});
test('garbage is ignored', () => {
  expect(decodeOrigin('lixo', 0)).toBeNull();
  expect(decodeOrigin('{"x":"a","y":1,"t":0}', 0)).toBeNull();
  expect(decodeOrigin('null', 0)).toBeNull();
});
test('missing value is ignored', () => {
  expect(decodeOrigin(null, 0)).toBeNull();
});
