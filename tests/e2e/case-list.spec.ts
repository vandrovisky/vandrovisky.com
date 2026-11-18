import { expect, test } from '@playwright/test';

test('cases are an editorial list, not boxes', async ({ page }) => {
  await page.goto('/pt/');
  const rows = page.locator('#cases [data-case]');
  await expect(rows).toHaveCount(4);
  await expect(page.locator('#cases .case-card__cover')).toHaveCount(0);
  await expect(rows.first().locator('.case-row__index')).toHaveText('01');
  await expect(rows.nth(3).locator('.case-row__index')).toHaveText('04');
  // the title appears once per row
  const title = await rows.first().locator('h3').textContent();
  expect((await rows.first().textContent())!.split(title!.trim()).length - 1).toBe(1);
});

test('the whole row is one link to the case', async ({ page }) => {
  await page.goto('/');
  const row = page.locator('#cases [data-case]').first();
  await expect(row.locator('a')).toHaveCount(1);
  await row.locator('.case-row__summary').click();
  await expect(page).toHaveURL(/\/work\/[a-z-]+\/$/);
});
