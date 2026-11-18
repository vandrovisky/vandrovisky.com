/**
 * Screenshot a site for a case study (the URL is only an argument; it is never stored in the site).
 *   npm run capture -- <slug> <url> [--mobile] [--desktop] [--hide "<css selector>"]
 * Writes src/assets/work/<slug>-desktop.png and/or <slug>-mobile.png. Default: both.
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, devices } from '@playwright/test';

const args = process.argv.slice(2);
const [slug, url] = args;
if (!slug || !url || !/^https?:\/\//.test(url) || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('usage: npm run capture -- <slug> <https://url> [--mobile] [--desktop] [--hide "<css>"]');
  process.exit(1);
}
const flag = (f: string) => args.includes(f);
const hideIdx = args.indexOf('--hide');
const hide = hideIdx > -1 ? args[hideIdx + 1] : undefined;
const wantMobile = flag('--mobile') || !flag('--desktop');
const wantDesktop = flag('--desktop') || !flag('--mobile');

const OUT = join(process.cwd(), 'src', 'assets', 'work');
const { defaultBrowserType: _ignored, ...iphone } = devices['iPhone 15'];
const targets = [
  ...(wantDesktop ? [{ name: 'desktop', ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } }] : []),
  ...(wantMobile ? [{ name: 'mobile', ctx: iphone }] : []),
];

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
try {
  for (const t of targets) {
    const page = await (await browser.newContext(t.ctx)).newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    if (hide) await page.addStyleTag({ content: `${hide} { display: none !important; }` });
    await page.waitForTimeout(1000);
    const file = join(OUT, `${slug}-${t.name}.png`);
    await page.screenshot({ path: file });
    console.log(`[capture] ${file}`);
  }
} finally {
  await browser.close();
}
