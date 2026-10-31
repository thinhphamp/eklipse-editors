import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serveDist } from './serve-dist.mjs';
import { browserPath } from './browser-path.mjs';

const out = process.argv[2];
mkdirSync(out, { recursive: true });
const server = await serveDist(new URL('../'+(process.argv.includes('--dist')?process.argv[process.argv.indexOf('--dist')+1]:'dist'), import.meta.url).pathname);
const browser = await chromium.launch({ executablePath: browserPath() });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const base = `http://127.0.0.1:${server.address().port}/prototype.html?screen=`;
const cases = [
  ['crop','L04','.source-crop','.crop-selected','.crop-handle','.crop-toolbar'],
  ['image','E02','.preview-item-art','.preview-item.selected','.selection-handle','.selected-toolbar'],
  ['social','E04','.preview-item-art','.preview-item.selected','.selection-handle','.selected-toolbar'],
  ['text','E08','.preview-item-art','.preview-item.selected','.selection-handle','.selected-toolbar'],
  ['reaction','E13','.preview-item-art','.preview-item.selected','.selection-handle','.selected-toolbar'],
  ['sticker','E15','.preview-item-art','.preview-item.selected','.selection-handle','.selected-toolbar'],
  ['gif','E17','.preview-item-art','.preview-item.selected','.selection-handle','.selected-toolbar'],
  ['emote','E20','.preview-item-art','.preview-item.selected','.selection-handle','.selected-toolbar'],
  ['caption','C01','.preview-caption','.caption-selected','.caption-handle','.caption-toolbar'],
  ['timeline-element','E08','.timeline-chip.element','.timeline-chip.selected','.chip-trim','.timeline-selection-actions'],
  ['timeline-effect','F01','.timeline-chip.effect','.timeline-chip.selected','.chip-trim','.timeline-selection-actions'],
  ['timeline-audio','A01','.timeline-chip.audio','.timeline-chip.selected','.chip-trim','.timeline-selection-actions'],
  ['caption-segment','C01','.caption-segment','.caption-segment.selected','.detach-caption','.detach-caption'],
  ['video-segment','T01','.video-segment','.video-segment.selected','.timeline-selection-actions','.timeline-selection-actions'],
];
try {
  for (const [name,id,target,selected,handles,toolbar] of cases) {
    try {
      await page.goto(base+id);
      await page.waitForSelector('#root > *');
      await page.waitForTimeout(250);
      await page.locator(target).first().click({timeout:2000});
      const state = [selected,handles,toolbar].map(s=>page.locator(s).first().isVisible().catch(()=>false));
      const [s,h,t]=await Promise.all(state);
      await page.screenshot({path:`${out}/${name}.png`});
      await page.keyboard.press('Escape');
      await page.waitForTimeout(80);
      const escape=!(await page.locator(selected).first().isVisible().catch(()=>false));
      await page.locator(target).first().click();
      const emptyTarget=name==='crop'?'.source-canvas':name.startsWith('timeline')||name.includes('segment')?'.timeline-content':'.phone-preview';
      await page.locator(emptyTarget).first().click({position:{x:3,y:emptyTarget==='.timeline-content'?55:3},force:true});
      await page.waitForTimeout(50);
      const empty=!(await page.locator(selected).first().isVisible().catch(()=>false));
      await page.locator(target).first().click().catch(()=>{});
      await page.keyboard.press('Delete');
      await page.waitForTimeout(80);
      const deleted=!(await page.locator(selected).first().isVisible().catch(()=>false));
      console.log(`${s&&h&&t&&escape&&empty&&deleted?'PASS':'FAIL'} ${name} selected=${s} handles=${h} toolbar=${t} escape=${escape} empty=${empty} delete=${deleted}`);
    } catch(e) { console.log(`FAIL ${name} ${String(e).slice(0,120)}`); }
  }
} finally { await browser.close(); server.close(); }
