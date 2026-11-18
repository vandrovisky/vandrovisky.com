import { expect, test } from 'vitest';
import { shouldHideNav } from '../../src/scripts/motion/nav';

test('near the top the nav stays', () => expect(shouldHideNav(0, 50)).toBe(false));
test('scrolling down past the threshold hides it', () => expect(shouldHideNav(100, 200)).toBe(true));
test('scrolling up shows it', () => expect(shouldHideNav(300, 200)).toBe(false));
test('custom threshold', () => expect(shouldHideNav(100, 200, 500)).toBe(false));
