// Visual QA for the Claude improvement prototype. Usage: node scripts/shot-claude.mjs <outDir>
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serveDist } from './serve-dist.mjs';
import { browserPath } from './browser-path.mjs';

const out = process.argv[2];
mkdirSync(out, { recursive: true });
const server = await serveDist(new URL('../dist', import.meta.url).pathname);
const url = `http://127.0.0.1:${server.address().port}/prototype.html`;
const browser = await chromium.launch({ executablePath: browserPath() });
const errors = [];
try {
  for (const [w, h, sfx] of [[1600, 900, ''], [1280, 800, '-1280']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('console', m => { if (m.type() === 'error') errors.push(`${w}: ${m.text()}`); });
    page.on('pageerror', e => errors.push(`${w}: ${e}`));
    const shot = n => page.screenshot({ path: `${out}/${n}${sfx}.png` });
    await page.goto(url); await page.waitForSelector('.topbar'); await page.waitForTimeout(500);
    await shot('01-default');
    // Apply from a blank clip (screen L00: no captions, no music), then undo once.
    await page.goto(url + '?screen=L00'); await page.waitForSelector('.topbar'); await page.waitForTimeout(400);
    await shot('02a-blank');
    await page.locator('button.style-quickstart').click(); await page.waitForTimeout(500);
    await shot('02-applied');
    console.log(w, 'after apply, done chips:', await page.locator('.finish-chip.done').count(), 'lanes:', await page.locator('.timeline').innerText().then(t => t.replace(/\s+/g, ' ').slice(0, 160)));
    await page.keyboard.press('ControlOrMeta+z'); await page.waitForTimeout(300);
    console.log(w, 'after one undo, done chips:', await page.locator('.finish-chip.done').count());
    await shot('02b-undone');
    await page.goto(url); await page.waitForSelector('.topbar'); await page.waitForTimeout(300);
    await page.getByRole('button', { name: /My styles/ }).click(); await page.waitForTimeout(200); await shot('03-styles-menu');
    await page.getByRole('button', { name: 'What changed' }).click(); await page.waitForTimeout(200); await shot('03b-what-changed');
    await page.mouse.click(900, 60);
    await page.locator('.tb-primary').click(); await page.waitForTimeout(300); await shot('04-export');
    await page.locator('.modal-shade .dialog-x').first().click(); await page.waitForTimeout(200);
    await page.keyboard.press('ControlOrMeta+e'); await page.waitForTimeout(300); await shot('04b-export-cmd-e');
    await page.locator('.modal-shade .dialog-x').first().click(); await page.waitForTimeout(200);
    console.log(w, 'modal closed:', await page.locator('.modal-shade').count() === 0);
    await page.locator('.tb-primary').click(); await page.waitForTimeout(200);
    await page.getByText('720p High Frame Rate').click(); await page.waitForTimeout(100);
    await page.reload(); await page.waitForSelector('.topbar'); await page.locator('.tb-primary').click(); await page.waitForTimeout(300);
    console.log(w, 'quality after reload selected:', await page.locator('.modal-shade').innerText().then(t => /720p\s*60 fps\s*720p High/.test(t)), await page.locator('input[type=radio]:checked').evaluateAll(a => a.map(x => x.value || x.id)));
    await shot('04c-quality-persisted');
    await page.locator('.modal-shade .dialog-x').first().click(); await page.waitForTimeout(200);
    for (const t of ['Captions', 'Audio', 'Effects', 'Elements']) {
      await page.locator('.rail').getByText(t, { exact: true }).first().click(); await page.waitForTimeout(400); await shot('05-' + t.toLowerCase());
    }
    await page.close();
  }
} finally { await browser.close(); server.close(); }
console.log('console errors:', errors.length ? '\n' + errors.join('\n') : 'none');
