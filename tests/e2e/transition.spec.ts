import { expect, test } from '@playwright/test';

test('clicking a nav link navigates and stores the click origin', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.locator('#cases [data-case] a').first().click();
  await expect(page).toHaveURL(/\/work\/[a-z-]+\/$/);
  const at = await page.evaluate(() => document.documentElement.style.getPropertyValue('--vt-at'));
  expect(at).toMatch(/^\d+(\.\d+)?px \d+(\.\d+)?px$/);
  expect(errors).toEqual([]);
});

test('navigation still works when sessionStorage throws', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('blocked'); } });
  });
  await page.goto('/');
  await page.locator('#cases [data-case] a').first().click();
  await expect(page).toHaveURL(/\/work\/[a-z-]+\/$/);
  expect(errors).toEqual([]);
});

test('view transition css is present', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const cssLinks = [...html.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map((m) => m[1]);
  const css = (await Promise.all(cssLinks.map(async (l) => (await request.get(l)).text()))).join('') + html;
  expect(css).toMatch(/@view-transition/);
  // opt-in must be inline in <head>: an external stylesheet can be applied after Chromium checks it
  expect(html).toMatch(/<style>[^<]*@view-transition/);
});
