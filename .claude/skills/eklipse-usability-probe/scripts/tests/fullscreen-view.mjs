// Regression: fullscreen paints only the preview subtree, not the editor's hidden rail/panels.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { startBroker, stopBroker } from '../lib/broker-client.mjs';
import { SKILL, loadProbe, loadPersona, call } from '../lib/common.mjs';
const out=process.argv[2]; if(!out)throw new Error('provide an evidence output directory');
const b=await startBroker(out,{max:1});
try {
 const probe=loadProbe(join(SKILL,'probes/claude-improvement/elements-add-top-text.json'));
 const runDir=join(out,'1');mkdirSync(runDir,{recursive:true});
 const {id}=await call(b.apiPort,'/session',{probe,persona:loadPersona('returning-twitch-clipper'),runDir,runId:'fullscreen-regression'},b.token);
 const act=body=>call(b.apiPort,`/s/${id}/act`,body);
 await act({action:'look'});
 const normal=await act({action:'click',target:'Elements'});assert.match(normal.text,/button "Elements"/);
 const fullscreen=await act({action:'click',target:'Fullscreen'});
 assert.doesNotMatch(fullscreen.text,/button "Elements"|Your brand sticker/);
 console.log('PASS fullscreen view omits hidden editor rail and brand panel');
 const restored=await act({action:'key',key:'Escape'});
 assert.match(restored.text,/button "Elements"/);
 console.log('PASS Escape restores the normal editor view');
 await call(b.apiPort,`/s/${id}/judge`,{meta:{}},b.token);
} finally {console.log(await stopBroker(b));}
