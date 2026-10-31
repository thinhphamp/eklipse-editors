// Regression: type --ref must preserve an existing selection in the already-focused field.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { startBroker, stopBroker } from '../lib/broker-client.mjs';
import { SKILL, loadProbe, loadPersona, call } from '../lib/common.mjs';
const out = process.argv[2];
if (!out) throw new Error('provide an evidence output directory');
const broker = await startBroker(out, { max: 1 });
try {
 for (const [n, key] of ['Meta+A','Control+A','Ctrl+A'].entries()) {
  const probe = loadProbe(join(SKILL,'probes/claude-improvement/elements-rename-handle-everywhere.json'));
  const runDir = join(out,String(n+1)); mkdirSync(runDir,{recursive:true});
  const { id } = await call(broker.apiPort,'/session',{probe,persona:loadPersona('returning-twitch-clipper'),runDir,runId:`selection-regression/${n+1}`},broker.token);
  const act = body => call(broker.apiPort,`/s/${id}/act`,body);
  await act({action:'look'});
  const {text} = await act({action:'click',target:'Elements'});
  const ref = text.match(/^\[(\d+)\] textbox "Handle"/m)?.[1]; assert.ok(ref,text);
  await act({action:'click',ref}); await act({action:'key',key});
  await act({action:'type',text:'pixelpanda_tv',ref});
  const result = await call(broker.apiPort,`/s/${id}/judge`,{meta:{}},broker.token);
  assert.equal(result.executionError,undefined); assert.equal(result.success,true,JSON.stringify(result));
  console.log(`PASS ${key} then type --ref replaces rather than appends`);
 }
} finally {console.log(await stopBroker(broker));}
