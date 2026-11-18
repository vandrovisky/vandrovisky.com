import { expect, test } from '@playwright/test';

const PAGES = ['/', '/about/', '/work/', '/hobbies/', '/contact/', '/pt/', '/pt/sobre/', '/pt/trabalho/', '/pt/hobbies/', '/pt/contato/'];

for (const path of PAGES) {
  test(`${path} responds with one <h1>`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
  });
}

test('work lists 7 cases in each language', async ({ page }) => {
  await page.goto('/work/');
  await expect(page.locator('[data-case]')).toHaveCount(7);
  await page.goto('/pt/trabalho/');
  await expect(page.locator('[data-case]')).toHaveCount(7);
});

test('case page renders and credits JMV', async ({ page }) => {
  const res = await page.goto('/work/jmv-play/');
  expect(res?.status()).toBe(200);
  await expect(page.getByText('JMV Technology')).toBeVisible();
});

test('visual cases never link to the live sites', async ({ page }) => {
  for (const path of ['/', '/work/', '/pt/trabalho/', '/work/jmv-play/', '/work/color-fantasy/', '/work/agora/', '/pt/trabalho/agora/']) {
    await page.goto(path);
    await expect(page.locator('a[href*="jmvplay"], a[href*="colorfantasy"], a[href*="jmvstream"]')).toHaveCount(0);
  }
});

test('case language switch keeps the case', async ({ page }) => {
  await page.goto('/work/agora/');
  await page.getByRole('link', { name: 'Ler em português' }).click();
  await expect(page).toHaveURL(/\/pt\/trabalho\/agora\/$/);
});

test('about has certifications section', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('#certifications')).toBeVisible();
  await page.goto('/pt/sobre/');
  await expect(page.locator('#certificacoes')).toBeVisible();
});

test('cv pdfs are downloadable', async ({ request, page }) => {
  expect((await request.get('/cv/eric-robertson-cv-en.pdf')).status()).toBe(200);
  expect((await request.get('/cv/eric-robertson-cv-pt.pdf')).status()).toBe(200);
  await page.goto('/contact/');
  await expect(page.locator('a[href="/cv/eric-robertson-cv-en.pdf"]')).toBeVisible();
});

test('unknown page is a 404 with a way home', async ({ page }) => {
  const res = await page.goto('/nao-existe/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('main a[href="/"]')).toBeVisible();
});
