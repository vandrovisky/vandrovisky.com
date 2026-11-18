import { expect, test } from '@playwright/test';

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('every reveal element is fully visible', async ({ page }) => {
    await page.goto('/about/');
    const opacities = await page.locator('[data-reveal]').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(opacities.length).toBeGreaterThan(3);
    expect(opacities.every((o) => o === '1')).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
  });
});

test('elements reveal when scrolled into view', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/about/');
  const last = page.locator('section[data-reveal]').last();
  await expect(last).not.toHaveAttribute('data-revealed', /.*/);
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveAttribute('data-revealed', '');
});

test('word reveal keeps the heading accessible', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
  await expect(page.locator('h1 .word')).toHaveCount(1);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('content below the fold is visible without scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto('/about/');
    const o = await page.locator('section[data-reveal]').last().evaluate((e) => getComputedStyle(e).opacity);
    expect(o).toBe('1');
  });
});

test('nav hides on scroll down and returns on scroll up', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/about/');
  const nav = page.locator('[data-nav]');
  await page.mouse.wheel(0, 600);
  await expect(nav).toHaveAttribute('data-hidden', '');
  await page.mouse.wheel(0, -200);
  await expect(nav).not.toHaveAttribute('data-hidden', /.*/);
});

test('nav comes back when it receives keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/about/');
  await page.mouse.wheel(0, 600);
  const nav = page.locator('[data-nav]');
  await expect(nav).toHaveAttribute('data-hidden', '');
  await nav.getByRole('link').first().focus();
  await expect(nav).not.toHaveAttribute('data-hidden', /.*/);
});

test('content shows up even when the bundled module is blocked', async ({ page }) => {
  await page.route(/\/_astro\/.*\.js$/, (route) => route.abort());
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/about/');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/); // inline script still ran
  await expect
    .poll(() => page.locator('section[data-reveal]').last().evaluate((e) => getComputedStyle(e).opacity), { timeout: 5000 })
    .toBe('1');
});
