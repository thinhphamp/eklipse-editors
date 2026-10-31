import { chromium } from 'playwright-core';
import { serveDist } from './serve-dist.mjs';
import { browserPath } from './browser-path.mjs';
const server=await serveDist(new URL('../'+(process.argv.includes('--dist')?process.argv[process.argv.indexOf('--dist')+1]:'dist'),import.meta.url).pathname);
const browser=await chromium.launch({executablePath:browserPath(),args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const result=(name,ok,detail='')=>console.log(`${ok?'PASS':'FAIL'} ${name} ${detail}`);
try {
 await page.goto(`http://127.0.0.1:${server.address().port}/prototype.html?screen=L04`);
 await page.waitForSelector('#root > *');
 const areas=new Set(); let visible=0;
 for(let i=0;i<90;i++){
  await page.keyboard.press('Tab');
  const focus=await page.evaluate(()=>{const e=document.activeElement;if(!(e instanceof HTMLElement))return null;const area=e.closest('.rail,.side-panel,.playback,.timeline');const s=getComputedStyle(e);return {area:area?.className?.split(' ')[0]||'',outline:s.outlineStyle,boxShadow:s.boxShadow}});
  if(focus?.area)areas.add(focus.area);
  if(focus?.outline!=='none'||focus?.boxShadow!=='none')visible++;
 }
 result('Tab reaches rail panel playback timeline',['rail','side-panel','playback','timeline'].every(x=>areas.has(x)),[...areas].join(','));
 result('focus visible',visible>0,`${visible}/90`);
 await page.goto(`http://127.0.0.1:${server.address().port}/prototype.html?screen=L04`);
 await page.waitForSelector('.timecode b');
 await page.locator('.timeline-toolbar').click({position:{x:100,y:5}});
 const before=await page.locator('.timecode b').textContent();
 await page.keyboard.press('Space'); await page.waitForTimeout(900);
 const after=await page.locator('.timecode b').textContent();
 await page.keyboard.press('Space');
 result('Space play pause',before!==after,`${before}->${after}`);
 for(let i=0;i<4;i++) await page.keyboard.press('ArrowRight');
 result('arrow frame step',after!==await page.locator('.timecode b').textContent());
 await page.locator('.layout-tile').last().click();
 const changed=await page.locator('.layout-tile.selected strong').textContent();
 await page.keyboard.press('Meta+z');
 const undone=await page.locator('.layout-tile.selected strong').textContent();
 result('Command Z undo',changed!==undone,`${changed}->${undone}`);
} finally {await browser.close();server.close();}
