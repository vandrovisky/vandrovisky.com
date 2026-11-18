import { expect, test } from '@playwright/test';

test('single page has seo + hreflang tags', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('link[rel=alternate][hreflang="pt-BR"]')).toHaveAttribute('href', 'https://vandrovisky.com/pt/');
  await expect(page.locator('link[rel=alternate][hreflang="x-default"]')).toHaveAttribute('href', 'https://vandrovisky.com/');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://vandrovisky.com/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content', /.+/);
});

test('case page hreflang points to the translated case', async ({ page }) => {
  await page.goto('/work/payments/');
  await expect(page.locator('link[rel=alternate][hreflang="pt-BR"]')).toHaveAttribute('href', /\/pt\/trabalho\/payments\/$/);
});

test('language switch goes to the other single page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Ler em português' }).click();
  await expect(page).toHaveURL(/\/pt\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await page.getByRole('link', { name: 'Read in English' }).click();
  await expect(page).toHaveURL(/localhost:4321\/$/);
});

test('language switch keeps the visible section', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto('/');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect.poll(() => page.getByRole('link', { name: 'Ler em português' }).getAttribute('href')).toBe('/pt/#contato');
});

test('html gets the js class', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
});

test('sitemap and robots exist', async ({ request }) => {
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('https://vandrovisky.com/pt/');
  expect(sitemap).not.toContain('/about/');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://vandrovisky.com/sitemap-index.xml');
});
