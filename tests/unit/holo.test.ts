import { expect, test } from 'vitest';
import { pointerToVars } from '../../src/scripts/holo';

const rect = { left: 100, top: 100, width: 200, height: 300 };

test('centre is flat', () => {
  const v = pointerToVars(200, 250, rect);
  expect(v['--px']).toBe('50%');
  expect(v['--py']).toBe('50%');
  expect(v['--rx']).toBe('0deg');
  expect(v['--ry']).toBe('0deg');
  expect(v['--hyp']).toBe('0');
});

test('top-left corner tilts towards the pointer', () => {
  const v = pointerToVars(100, 100, rect);
  expect(v['--px']).toBe('0%');
  expect(v['--py']).toBe('0%');
  expect(parseFloat(v['--rx'])).toBeCloseTo(-50 / 3.5);
  expect(parseFloat(v['--ry'])).toBeCloseTo(50 / 3.5);
  expect(parseFloat(v['--hyp'])).toBeCloseTo(1);
});

test('pointer outside the card is clamped', () => {
  const v = pointerToVars(-500, 9999, rect);
  expect(v['--px']).toBe('0%');
  expect(v['--py']).toBe('100%');
});

test('zero-size rect does not produce NaN', () => {
  const v = pointerToVars(10, 10, { left: 0, top: 0, width: 0, height: 0 });
  expect(Object.values(v).some((s) => s.includes('NaN'))).toBe(false);
});
