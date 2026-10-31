// Visual QA for the 2026-10-27 re-check (C2 rail order, C6 Title chip, C9 AI review, C10 make vertical).
// Usage: node scripts/shot-recheck.mjs <outDir>
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serveDist } from './serve-dist.mjs';
import { browserPath } from './browser-path.mjs';

const out = process.argv[2];
mkdirSync(out, { recursive: true });
const server = await serveDist(new URL('../dist', import.meta.url).pathname);
const url = `http://127.0.0.1:${server.address().port}/prototype.html`;
const browser = await chromium.launch({ executablePath: browserPath() });
const errors = [], log = (...a) => console.log(...a);
try {
  for (const [w, h, sfx] of [[1600, 900, ''], [1280, 800, '-1280']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('console', m => { if (m.type() === 'error') errors.push(`${w}: ${m.text()}`); });
    page.on('pageerror', e => errors.push(`${w}: ${e}`));
    const shot = n => page.screenshot({ path: `${out}/${n}${sfx}.png` });
    const open = async s => { await page.goto(url + (s ? '?screen=' + s : '')); await page.waitForSelector('.topbar'); await page.waitForTimeout(500); };
    await open('');
    log(w, 'rail:', (await page.locator('.rail nav').innerText()).replace(/\s+/g, ' '));
    log(w, 'chips:', (await page.locator('.finish-steps').innerText()).replace(/\s+/g, ' '));
    await shot('r1-default');
    await page.locator('.finish-chip', { hasText: 'Title' }).click(); await page.waitForTimeout(400);
    log(w, 'title chip -> tab Elements text edit:', await page.locator('.rail nav button.active').innerText(), await page.getByText('Edit text element').count() > 0, 'chip done:', await page.locator('.finish-chip.done', { hasText: 'Title' }).count());
    await shot('r2-title-added');
    // C9
    await open('R01');
    log(w, 'ai strip:', (await page.locator('.ai-review-head p').innerText()));
    await shot('r3-ai-collapsed');
    await page.locator('.ai-review').getByRole('button', { name: 'Review' }).click(); await page.waitForTimeout(300);
    log(w, 'ai rows:', await page.locator('.ai-review-list li').count());
    await shot('r4-ai-open');
    await page.locator('.ai-item-remove').first().click(); await page.waitForTimeout(300);
    log(w, 'after remove rows:', await page.locator('.ai-review-list li').count());
    await page.keyboard.press('ControlOrMeta+z'); await page.waitForTimeout(300);
    log(w, 'after undo rows:', await page.locator('.ai-review-list li').count());
    await page.locator('.ai-item-keep').first().click(); await page.waitForTimeout(300);
    log(w, 'after keep rows:', await page.locator('.ai-review-list li').count());
    await shot('r5-ai-after-actions');
    await page.locator('.ai-review').getByRole('button', { name: 'Keep all' }).click(); await page.waitForTimeout(300);
    log(w, 'strip gone after keep all:', await page.locator('.ai-review').count() === 0);
    // C10
    await open('H01');
    log(w, 'layout chip:', await page.locator('.finish-chip.warn').innerText().then(t => t.replace(/\s+/g, ' ')));
    await shot('r6-landscape');
    await page.locator('.make-vertical .style-quickstart').click(); await page.waitForTimeout(500);
    log(w, 'after make vertical: card', await page.locator('.make-vertical').count(), 'warn chips', await page.locator('.finish-chip.warn').count());
    await shot('r7-made-vertical');
    await page.keyboard.press('ControlOrMeta+z'); await page.waitForTimeout(300);
    log(w, 'after undo: card back', await page.locator('.make-vertical').count());
    await page.close();
  }
} finally { await browser.close(); server.close(); }
log('console errors:', errors.length ? '\n' + errors.join('\n') : 'none');
