import { devices, expect, test } from '@playwright/test';

test.describe('desktop with mouse', () => {
  test('cursor follows the pointer with a spring', async ({ page }) => {
    await page.goto('/about/');
    await page.mouse.move(200, 300);
    await page.waitForTimeout(500);
    await expect(page.locator('html')).toHaveAttribute('data-cursor', '');
    const transform = await page.locator('.cursor').evaluate((el) => (el as HTMLElement).style.transform);
    expect(transform).toContain('translate3d(');
  });

  test('cursor becomes a ring over links and a caret over text', async ({ page }) => {
    await page.goto('/about/');
    await page.mouse.move(5, 5);
    await page.getByRole('navigation').getByRole('link').first().hover();
    await expect(page.locator('.cursor')).toHaveAttribute('data-shape', 'ring');
    await page.locator('.about__intro').hover();
    await expect(page.locator('.cursor')).toHaveAttribute('data-shape', 'caret');
  });

  test('cursor is decorative and never blocks clicks', async ({ page }) => {
    await page.goto('/');
    const cursor = page.locator('.cursor');
    await expect(cursor).toHaveAttribute('aria-hidden', 'true');
    expect(await cursor.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
  });

  test('native cursor is kept on form fields', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(200, 300);
    const cursor = await page.evaluate(() => {
      const input = document.createElement('input');
      document.body.append(input);
      return getComputedStyle(input).cursor;
    });
    expect(cursor).not.toBe('none');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no custom cursor', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(200, 300);
    await expect(page.locator('html')).not.toHaveAttribute('data-cursor', /.*/);
    await expect(page.locator('.cursor')).toBeHidden();
  });
});

test.describe('touch device', () => {
  const { defaultBrowserType: _ignored, ...pixel } = devices['Pixel 7'];
  test.use(pixel);
  test('no custom cursor and native cursor untouched', async ({ page }) => {
    await page.goto('/');
    await page.tap('h1');
    await expect(page.locator('html')).not.toHaveAttribute('data-cursor', /.*/);
    await expect(page.locator('.cursor')).toBeHidden();
    expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).not.toBe('none');
  });
});
