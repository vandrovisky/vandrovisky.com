import { expect, test } from '@playwright/test';

const bg = (page: import('@playwright/test').Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('page switches to the alternate mood in the cases section and back', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto('/');
  const base = await bg(page);
  await page.locator('#cases').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('#cases')!.scrollIntoView());
  await expect(page.locator('html')).toHaveAttribute('data-mood', 'alt');
  await expect.poll(() => bg(page)).not.toBe(base);
  await page.evaluate(() => document.querySelector('#hobbies')!.scrollIntoView());
  await expect(page.locator('html')).toHaveAttribute('data-mood', 'base');
  await expect.poll(() => bg(page)).toBe(base);
});

test('contact is also an alternate-mood section', async ({ page }) => {
  await page.goto('/pt/#contato');
  await expect(page.locator('html')).toHaveAttribute('data-mood', 'alt');
});

test('alternate mood keeps readable contrast', async ({ page }) => {
  await page.goto('/#cases');
  await expect(page.locator('html')).toHaveAttribute('data-mood', 'alt');
  await page.waitForTimeout(800);
  const [fg, back] = await page.evaluate(() => [getComputedStyle(document.querySelector('#cases h2')!).color, getComputedStyle(document.body).backgroundColor]);
  const lum = (c: string) => {
    const [r, g, b] = c.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(fg), lum(back)].sort((x, y) => y - x);
  expect((a + 0.05) / (b + 0.05)).toBeGreaterThan(7);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('stays on the base mood', async ({ page }) => {
    await page.goto('/#cases');
    await expect(page.locator('html')).not.toHaveAttribute('data-mood', 'alt');
  });
});
