// C8 check: blank clip starts with the brand sticker, finish bar Brand chip, Elements brand card, style keeps it.
import { chromium } from 'playwright-core';
import { browserPath } from './browser-path.mjs';
const out=process.argv[2];const b=await chromium.launch({executablePath:browserPath()});
try{const p=await b.newPage({viewport:{width:1600,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:4318/prototype.html?screen=L00',{waitUntil:'networkidle'});await p.waitForTimeout(800);
 console.log('chip:',await p.locator('.finish-chip').first().innerText());await p.screenshot({path:out+'/08a-blank-brand.png'});
 await p.locator('.finish-chip').first().click();await p.waitForTimeout(500);await p.screenshot({path:out+'/08b-brand-chip.png'});
 await p.screenshot({path:out+'/08c-elements-brand.png'});
 await p.locator('.brand-card-handle input').fill('valorantkid');await p.waitForTimeout(300);
 console.log('labels:',await p.evaluate(()=>document.querySelector('.brand-card-head small')?.textContent));
 await p.locator('button[title=Play]').click();await p.waitForTimeout(2000);await p.locator('button[title=Pause]').click();await p.waitForTimeout(300);await p.screenshot({path:out+'/08d-handle.png'});
 await p.getByRole('button',{name:/My styles/}).click();await p.waitForTimeout(300);await p.locator('.styles-menu>button').filter({hasText:'My FPS clips'}).click();await p.waitForTimeout(600);
 await p.screenshot({path:out+'/08e-style-applied.png'});console.log('errors',errs);
}finally{await b.close()}
