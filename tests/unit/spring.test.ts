import { describe, expect, test } from 'vitest';
import { isSettled, stepSpring, stretch, type SpringState } from '../../src/scripts/motion/spring';

const target = { x: 100, y: 50 };
const start: SpringState = { x: 0, y: 0, vx: 0, vy: 0 };

describe('stepSpring', () => {
  test('converges to the target', () => {
    let s = start;
    for (let i = 0; i < 200; i++) s = stepSpring(s, target);
    expect(isSettled(s, target)).toBe(true);
    expect(Math.abs(s.x - 100)).toBeLessThan(0.6);
    expect(Math.abs(s.y - 50)).toBeLessThan(0.6);
  });

  test('does not mutate its input', () => {
    const before = { ...start };
    stepSpring(start, target);
    expect(start).toEqual(before);
  });

  test('overshoots with the default config (it is a spring, not a lerp)', () => {
    let s = start;
    let maxX = 0;
    for (let i = 0; i < 100; i++) {
      s = stepSpring(s, target);
      maxX = Math.max(maxX, s.x);
    }
    expect(maxX).toBeGreaterThan(100);
  });

  test('first step follows the formula', () => {
    const s = stepSpring(start, target, { stiffness: 0.1, damping: 0.5 });
    expect(s.vx).toBeCloseTo((0 + 100 * 0.1) * 0.5);
    expect(s.x).toBeCloseTo(5);
  });
});

describe('isSettled', () => {
  test('false while moving fast even when on target', () => {
    expect(isSettled({ x: 100, y: 50, vx: 5, vy: 0 }, target)).toBe(false);
  });
  test('false when slow but far', () => {
    expect(isSettled({ x: 90, y: 50, vx: 0, vy: 0 }, target)).toBe(false);
  });
});

describe('stretch', () => {
  test('no velocity → no stretch', () => {
    const s = stretch(0, 0);
    expect(s.scaleX).toBe(1);
    expect(s.scaleY).toBe(1);
  });
  test('stretch is capped at 1.4', () => {
    const s = stretch(1000, 0);
    expect(s.scaleX).toBeCloseTo(1.4);
    expect(s.scaleY).toBeCloseTo(0.8);
  });
  test('angle follows the velocity direction', () => {
    expect(stretch(0, 10).angle).toBeCloseTo(Math.PI / 2);
  });
});
