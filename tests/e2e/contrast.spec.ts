import { expect, test } from '@playwright/test';

const ratio = (fg: string, bg: string) => {
  const lum = (c: string) => {
    const [r, g, b] = c.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} scheme`, () => {
    test.use({ colorScheme: scheme, javaScriptEnabled: false }); // base mood, no reveal animation
    test('accent-coloured text meets WCAG AA (4.5:1)', async ({ page }) => {
      await page.goto('/');
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      for (const sel of ['.hero__kicker', '.case-row__index']) {
        const fg = await page.locator(sel).first().evaluate((e) => getComputedStyle(e).color);
        expect(ratio(fg, bg), sel).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
}

test('case index stays readable inside the dark cases section', async ({ page }) => {
  await page.goto('/#cases');
  await expect(page.locator('html')).toHaveAttribute('data-mood', 'alt');
  await page.waitForTimeout(900);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const fg = await page.locator('.case-row__index').first().evaluate((e) => getComputedStyle(e).color);
  expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
});
