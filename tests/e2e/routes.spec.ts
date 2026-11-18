import { expect, test } from '@playwright/test';

const SECTIONS = {
  '/': ['about', 'cases', 'hobbies', 'contact'],
  '/pt/': ['sobre', 'cases', 'hobbies', 'contato'],
};

for (const [path, ids] of Object.entries(SECTIONS)) {
  test(`${path} is one continuous page with every section`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    const order = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id));
    expect(order).toEqual(ids);
  });
}

test('only the described cases are listed', async ({ page }) => {
  for (const path of ['/', '/pt/']) {
    await page.goto(path);
    await expect(page.locator('#cases [data-case]')).toHaveCount(4);
  }
});

test('removed pages and visual cases are gone', async ({ request }) => {
  for (const path of ['/about/', '/work/', '/hobbies/', '/contact/', '/pt/sobre/', '/pt/trabalho/', '/pt/hobbies/', '/pt/contato/',
    '/work/jmv-play/', '/work/color-fantasy/', '/work/agora/', '/pt/trabalho/agora/']) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test('case page renders, credits the company and goes back to the cases section', async ({ page }) => {
  const res = await page.goto('/work/laravel-migration/');
  expect(res?.status()).toBe(200);
  await expect(page.getByText('Prontomed')).toBeVisible();
  await page.getByRole('link', { name: /All work|cases/i }).first().click();
  await expect(page).toHaveURL(/\/#cases$/);
});

test('nav on a case page points back to the single page sections', async ({ page }) => {
  await page.goto('/pt/trabalho/payments/');
  const hrefs = await page.getByRole('navigation').getByRole('link').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual(['/pt/#sobre', '/pt/#cases', '/pt/#hobbies', '/pt/#contato']);
});

test('case language switch keeps the case', async ({ page }) => {
  await page.goto('/work/payments/');
  await page.getByRole('link', { name: 'Ler em português' }).click();
  await expect(page).toHaveURL(/\/pt\/trabalho\/payments\/$/);
});

test('about section has certifications', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#certifications')).toBeAttached();
  await page.goto('/pt/');
  await expect(page.locator('#certificacoes')).toBeAttached();
});

test('cv pdfs are downloadable from the contact section', async ({ request, page }) => {
  expect((await request.get('/cv/eric-robertson-cv-en.pdf')).status()).toBe(200);
  expect((await request.get('/cv/eric-robertson-cv-pt.pdf')).status()).toBe(200);
  await page.goto('/');
  await expect(page.locator('#contact a[href="/cv/eric-robertson-cv-en.pdf"]')).toBeAttached();
});

test('no link to the JMV live sites anywhere', async ({ page }) => {
  for (const path of ['/', '/pt/', '/work/payments/']) {
    await page.goto(path);
    await expect(page.locator('a[href*="jmvplay"], a[href*="colorfantasy"], a[href*="jmvstream"]')).toHaveCount(0);
  }
});

test('unknown page is a 404 with a way home', async ({ page }) => {
  const res = await page.goto('/nao-existe/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('main a[href="/"]')).toBeVisible();
});

for (const width of [360, 1280]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ['/', '/pt/', '/work/laravel-migration/']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
}
