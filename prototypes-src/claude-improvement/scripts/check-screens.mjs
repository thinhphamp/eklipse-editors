// Opens every evidence screen (?screen=<ID>) from the built folder in headless
// Chromium and reports console errors, empty panels and external requests.
// Usage: node scripts/check-screens.mjs [--shots <dir>] [--undo]
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serveDist } from './serve-dist.mjs';
import { browserPath } from './browser-path.mjs';

const args = process.argv.slice(2);
const shots = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : '';
const ids = readFileSync(new URL('./screen-ids.txt', import.meta.url), 'utf8').trim().split(/\s+/);
const distDir = args.includes('--dist') ? args[args.indexOf('--dist') + 1] : 'dist';
const server = await serveDist(new URL('../' + distDir, import.meta.url).pathname);
const base = `http://127.0.0.1:${server.address().port}/prototype.html`;
const browser = await chromium.launch({ executablePath: browserPath() });
const failures = [];
const external = new Set();
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: args.includes('--viewport-height') ? Number(args[args.indexOf('--viewport-height') + 1]) : 1080 } });
  if (args.includes('--block-external')) {
    await page.route('**/*', route => {
      const url = route.request().url();
      return url.startsWith('http://127.0.0.1:') || url.startsWith('data:') || url.startsWith('blob:')
        ? route.continue() : route.abort();
    });
  }
  let errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.add(r.url()); });
  if (shots) mkdirSync(shots, { recursive: true });
  for (const id of ids) {
    errors = [];
    await page.goto(`${base}?screen=${id}`, { waitUntil: 'load' }); await page.waitForSelector('#root > *'); await page.waitForFunction(() => !document.querySelector('.side-panel') || document.querySelector('.side-panel .panel-scroll')?.children.length, null, { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(150);
    const ok = await page.evaluate(() => !!document.querySelector('#root')?.children.length &&
      (!!document.querySelector('.side-panel .panel-scroll')?.children.length || !document.querySelector('.side-panel')));
    if (!ok || errors.length) failures.push({ id, ok, errors: errors.slice(0, 3) });
    if (shots) await page.screenshot({ path: `${shots}/${id}.png` });
  }
  if (args.includes('--undo')) {
    await page.goto(`${base}?screen=L01`, { waitUntil: 'load' }); await page.waitForSelector('#root > *'); await page.waitForFunction(() => !document.querySelector('.side-panel') || document.querySelector('.side-panel .panel-scroll')?.children.length, null, { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(150);
    const before = await page.locator('.layout-tile.selected strong').first().textContent().catch(() => '');
    const tiles = page.locator('.side-panel .layout-tile:has-text("Split")');
    await tiles.first().click();
    const after = await page.locator('.layout-tile.selected strong').first().textContent().catch(() => '');
    await page.getByRole('button', { name: /Undo/ }).first().click();
    const undone = await page.locator('.layout-tile.selected strong').first().textContent().catch(() => '');
    console.log('undo check:', JSON.stringify({ before, after, undone }), before === undone && before !== after ? 'PASS' : 'FAIL');
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`screens: ${ids.length}, failures: ${failures.length}, external requests: ${external.size}`);
for (const f of failures) console.log(' ', JSON.stringify(f));
for (const u of [...external].slice(0, 10)) console.log('  external:', u);
process.exit(failures.length || external.size ? 1 : 0);
