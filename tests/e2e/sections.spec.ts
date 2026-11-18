import { expect, test } from '@playwright/test';

test('menu scrolls to the section and highlights it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto('/');
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'Hobbies' }).click();
  await expect(page).toHaveURL(/#hobbies$/);
  await expect.poll(() => page.locator('#hobbies').evaluate((e) => Math.round(e.getBoundingClientRect().top))).toBeLessThan(200);
  await expect(nav.getByRole('link', { name: 'Hobbies' })).toHaveAttribute('aria-current', 'location');
});

test('sticky header does not cover the section heading', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto('/#contact');
  const header = await page.locator('[data-nav]').evaluate((e) => e.getBoundingClientRect().bottom);
  const h2 = await page.locator('#contact h2').evaluate((e) => e.getBoundingClientRect().top);
  expect(h2).toBeGreaterThanOrEqual(header);
});

test('highlight follows manual scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto('/pt/');
  await page.locator('#sobre').scrollIntoViewIfNeeded();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Sobre' })).toHaveAttribute('aria-current', 'location');
});
