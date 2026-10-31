import { chromium } from 'playwright-core';
import { browserPath } from './browser-path.mjs';
const out=process.argv[2];const b=await chromium.launch({executablePath:browserPath()});
try{for(const [w,h,tag] of [[1280,900,'desk'],[390,844,'phone']])for(const l of ['vi','en']){const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:4318/report.html?lang='+l,{waitUntil:'networkidle'});const ow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);await p.screenshot({path:`${out}/report-${tag}-${l}.png`,fullPage:tag==='desk'});console.log(tag,l,'overflowX',ow,'errors',errs.length);await p.close()}}finally{await b.close()}
