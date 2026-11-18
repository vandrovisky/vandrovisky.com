import { expect, test } from 'vitest';
import { activeSection } from '../../src/scripts/sections';

const s = (id: string, top: number) => ({ id, top });

test('none before the first section passes the line', () => {
  expect(activeSection([s('about', 500), s('cases', 1500)], 300)).toBeNull();
});
test('the last section whose top crossed the line wins', () => {
  expect(activeSection([s('about', -900), s('cases', 120), s('hobbies', 900)], 300)).toBe('cases');
});
test('exactly on the line counts', () => {
  expect(activeSection([s('about', 300)], 300)).toBe('about');
});
