import { devices, expect, test } from '@playwright/test';

const loaded = (page: import('@playwright/test').Page) =>
  page.locator('.holo img').evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0));

test('six holo cards with loaded images and the disclaimer', async ({ page }) => {
  await page.goto('/hobbies/');
  await expect(page.locator('.holo')).toHaveCount(6);
  await page.waitForLoadState('networkidle');
  expect((await loaded(page)).every(Boolean)).toBe(true);
  await expect(page.getByText(/The Pokémon Company, Wizards of the Coast, Bandai/)).toBeVisible();
});

test('pt page has the cards too', async ({ page }) => {
  await page.goto('/pt/hobbies/');
  await expect(page.locator('.holo')).toHaveCount(6);
});

test('alt text describes each card', async ({ page }) => {
  await page.goto('/hobbies/');
  const alts = await page.locator('.holo img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt') ?? ''));
  expect(alts).toHaveLength(6);
  expect(alts.every((a) => / — /.test(a))).toBe(true);
});

test('hovering tilts the card', async ({ page }) => {
  await page.goto('/hobbies/');
  const card = page.locator('.holo').first();
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.move(box.x + 20, box.y + 20);
  await expect.poll(async () => card.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--rx'))).not.toBe('');
  const rx = await card.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--rx'));
  expect(rx).not.toBe('0deg');
});

test('the hand changes between visits', async ({ page }) => {
  const hands = new Set<string>();
  for (let i = 0; i < 5; i++) {
    await page.goto('/hobbies/');
    hands.add((await page.locator('.holo img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt')))).join('|'));
  }
  expect(hands.size).toBeGreaterThanOrEqual(2);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('six cards still render', async ({ page }) => {
    await page.goto('/hobbies/');
    await expect(page.locator('.holo')).toHaveCount(6);
    await expect(page.locator('.holo img').first()).toBeVisible();
  });
});

test.describe('touch', () => {
  const { defaultBrowserType: _ignored, ...pixel } = devices['Pixel 7'];
  test.use(pixel);
  test('a tap tilts, tapping elsewhere flattens it again', async ({ page }) => {
    await page.goto('/hobbies/');
    const card = page.locator('.holo').first();
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;
    await page.touchscreen.tap(box.x + 8, box.y + 8);
    await page.touchscreen.tap(5, 5);
    await expect.poll(async () => card.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--rx') || '0deg')).toBe('0deg');
  });
});
