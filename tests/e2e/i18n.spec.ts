import { expect, test } from '@playwright/test';

test('about page has seo + hreflang tags', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('link[rel=alternate][hreflang="pt-BR"]')).toHaveAttribute('href', /\/pt\/sobre\/$/);
  await expect(page.locator('link[rel=alternate][hreflang="en-US"]')).toHaveAttribute('href', /\/about\/$/);
  await expect(page.locator('link[rel=alternate][hreflang="x-default"]')).toHaveAttribute('href', /\/about\/$/);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://vandrovisky.com/about/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content', /.+/);
});

test('language switch goes to the equivalent page', async ({ page }) => {
  await page.goto('/about/');
  await page.getByRole('link', { name: 'Ler em português' }).click();
  await expect(page).toHaveURL(/\/pt\/sobre\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await page.getByRole('link', { name: 'Read in English' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
});

test('nav marks the current page', async ({ page }) => {
  await page.goto('/pt/sobre/');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Sobre' })).toHaveAttribute('aria-current', 'page');
});

test('html gets the js class', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\bjs\b/);
});

test('sitemap and robots exist', async ({ request }) => {
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://vandrovisky.com/sitemap-index.xml');
});
