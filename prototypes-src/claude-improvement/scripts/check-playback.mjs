// Plays the demo clip in headless Chromium and checks the clock, the canvas and cuts.
// Usage: node scripts/check-playback.mjs [--dist <dir>] [--shot <png>]
import { chromium } from 'playwright-core';
import { serveDist } from './serve-dist.mjs';
import { browserPath } from './browser-path.mjs';
import { runScenarios } from './check-playback-scenarios.mjs';

const args = process.argv.slice(2);
const distDir = args.includes('--dist') ? args[args.indexOf('--dist') + 1] : 'dist';
const shot = args.includes('--shot') ? args[args.indexOf('--shot') + 1] : '';
const server = await serveDist(new URL('../' + distDir, import.meta.url).pathname);
const base = `http://127.0.0.1:${server.address().port}/prototype.html`;
const browser = await chromium.launch({ executablePath: browserPath(), args: ['--autoplay-policy=no-user-gesture-required'] });
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + '?screen=L04', { waitUntil: 'load' }); await page.waitForSelector('#root > *'); await page.waitForFunction(() => !document.querySelector('.side-panel') || document.querySelector('.side-panel .panel-scroll')?.children.length, null, { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(150);
  const canPlay = await page.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.64001f"'));
  check('browser plays H.264', !!canPlay, canPlay);
  const timecode = () => page.locator('.timecode b').textContent();
  const t0 = await timecode();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForTimeout(2000);
  const t1 = await timecode();
  check('clock advances while playing', t1 !== t0, `${t0} -> ${t1}`);
  const painted = await page.evaluate(() => {
    const c = document.querySelector('.phone-preview .layout-canvas canvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let lit = 0; for (let i = 0; i < d.length; i += 400) if (d[i] + d[i + 1] + d[i + 2] > 60) lit++;
    return lit / (d.length / 400);
  });
  check('preview canvas shows video', painted > .3, painted.toFixed(2));
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const paused = await timecode();
  await page.waitForTimeout(500);
  check('Space pauses', paused === await timecode(), paused);
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  check('arrows step frames (4 × 1/30 s)', (await timecode()) !== paused, await timecode());
  if (shot) await page.screenshot({ path: shot });
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  if (args.includes('--scenarios')) { await runScenarios(page, base, check); check('no scenario page errors',errors.length===0,errors.slice(0,3).join(' | ')); }
} finally { await browser.close(); server.close(); }
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  ${r.detail}`);
process.exit(results.every(r => r.ok) ? 0 : 1);
