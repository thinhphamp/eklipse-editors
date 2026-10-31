// Click-crawl of the built prototype. Collects every visible control on every
// evidence screen, de-duplicates by region + label, clicks each one on a fresh
// load of its first screen and classifies the result:
//   state  - DOM changed beyond the toast (real behaviour)
//   toast  - only a toast appeared (explained no-op)
//   none   - nothing happened (dead control)
// Usage: node scripts/crawl-controls.mjs [--out file.json] [--only <screenPrefix>] [--dist <dir>]
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serveDist } from './serve-dist.mjs';
import { browserPath } from './browser-path.mjs';

const args = process.argv.slice(2);
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'crawl-result.json';
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : '';
const ids = readFileSync(new URL('./screen-ids.txt', import.meta.url), 'utf8').trim().split(/\s+/).filter(id => !only || only.split(',').some(p => id.startsWith(p)));
const distDir = args.includes('--dist') ? args[args.indexOf('--dist') + 1] : 'dist';
const server = await serveDist(new URL('../' + distDir, import.meta.url).pathname);
const base = `http://127.0.0.1:${server.address().port}/prototype.html`;
const browser = await chromium.launch({ executablePath: browserPath() });

const SELECTOR = 'button, [role=button], input, select, textarea, [draggable=true], [tabindex="0"]';
const collect = () => [...document.querySelectorAll('button, [role=button], input, select, textarea, [draggable=true], [tabindex="0"]')]
  .map((el, index) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.disabled || getComputedStyle(el).visibility === 'hidden') return null;
    const region = el.closest('.rail,.side-panel,.stage-tools,.stage,.playback,.timeline,.bottom-nav,.modal-shade,.toast,.overview-shell')?.className.split(' ')[0] || 'other';
    const label = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.getAttribute('placeholder') || el.getAttribute('name') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 60);
    const kind = el.getAttribute('role') === 'separator' || el.getAttribute('draggable') === 'true' ? 'drag' : el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'text' : el.tagName === 'INPUT' ? (el.type === 'range' ? 'slider' : el.type === 'checkbox' ? 'toggle' : el.type === 'file' ? 'file' : 'text') : 'button';
    return { index, region, label, kind };
  }).filter(Boolean);

const snapshot = () => {
  const root = document.querySelector('#root').cloneNode(true);
  root.querySelectorAll('.toast').forEach(t => t.remove());
  return { html: root.innerHTML.length + ':' + root.innerHTML.replace(/\d+(\.\d+)?/g, '').length + ':' + [...root.querySelectorAll('*')].length,
    raw: root.innerHTML, toast: document.querySelector('.toast')?.textContent || '' };
};

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
const controls = new Map();
try {
  for (const screen of ids) {
    await page.goto(`${base}?screen=${screen}`, { waitUntil: 'load' }); await page.waitForSelector('#root > *'); await page.waitForFunction(() => !document.querySelector('.side-panel') || document.querySelector('.side-panel .panel-scroll')?.children.length, null, { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(150);
    for (const c of await page.evaluate(collect)) {
      const key = c.region + '|' + c.kind + '|' + c.label;
      if (!controls.has(key)) controls.set(key, { ...c, screen, screens: 1 }); else controls.get(key).screens++;
    }
  }
  let n = 0;
  for (const c of controls.values()) {
    n++;
    await page.goto(`${base}?screen=${c.screen}`, { waitUntil: 'load' }); await page.waitForSelector('#root > *'); await page.waitForFunction(() => !document.querySelector('.side-panel') || document.querySelector('.side-panel .panel-scroll')?.children.length, null, { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(150);
    const before = await page.evaluate(snapshot);
    const handle = (await page.$$(SELECTOR))[c.index];
    try {
      if (!handle) throw new Error('not found');
      if (c.kind === 'slider') { const box = await handle.boundingBox(); if (!box) throw new Error('slider hidden'); await page.mouse.click(box.x + box.width * .7, box.y + box.height / 2); }
      else if (c.kind === 'select') await handle.evaluate(el => { el.selectedIndex = (el.selectedIndex + 1) % el.options.length; el.dispatchEvent(new Event('change', { bubbles: true })); });
      else if (c.kind === 'text') await handle.fill('crawl text');
      else if (c.kind === 'file') { c.result = 'file'; continue; }
      else if (c.kind === 'drag') { const box = await handle.boundingBox(); if (!box) throw new Error('drag handle hidden'); await page.mouse.move(box.x + box.width/2, box.y + box.height/2); await page.mouse.down(); await page.mouse.move(box.x + box.width/2, box.y + box.height/2 + 45, { steps: 5 }); await page.mouse.up(); }
      else await handle.click({ timeout: 1500 });
      await page.waitForTimeout(120);
      const after = await page.evaluate(snapshot);
      c.result = after.raw !== before.raw ? 'state' : after.toast && after.toast !== before.toast ? 'toast' : 'none';
      c.toast = after.toast || undefined;
    } catch (e) { c.result = 'error'; c.error = String(e).slice(0, 120); }
    if (n % 50 === 0) console.log(`  ${n}/${controls.size}`);
  }
} finally { await browser.close(); server.close(); }
const rows = [...controls.values()].map(({ index, ...c }) => c);
writeFileSync(out, JSON.stringify(rows, null, 1));
const count = k => rows.filter(r => r.result === k).length;
console.log(`controls: ${rows.length}, state: ${count('state')}, toast: ${count('toast')}, none: ${count('none')}, error: ${count('error')}, file: ${count('file')}, page errors: ${errors.length}`);
