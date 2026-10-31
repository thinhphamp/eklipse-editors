#!/usr/bin/env node
// Find legacy Select All -> type --ref sequences. Claude logs lack CLI args, so those
// selection/type pairs are conservatively marked as potentially affected. New fixed logs record keptFocus.
import { globSync, existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from './lib/common.mjs';
import { parseInvocation } from './lib/command-audit.mjs';
const {flags,pos} = parseArgs(process.argv.slice(2),['mark']);
if (!pos.length) throw new Error('usage: node audit-selection.mjs <run-dir>... [--mark] [--out file]');
const selectAll = key => /^(ControlOrMeta|Control|Ctrl|Meta|Cmd|Command)\+a$/i.test(key || '');
const findings = [];
for (const root of pos) for (const file of globSync(join(resolve(root),'**/result.json'))) {
 if (file.includes('/.attempts/') || file.includes('/.p/')) continue;
 const dir = dirname(file), actionsFile = join(dir,'actions.jsonl');
 if (!existsSync(actionsFile)) continue;
 const r = JSON.parse(readFileSync(file));
 if (!/^(claude|codex):/.test(r.player || '')) continue;
 const actions = readFileSync(actionsFile,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
 if (!actions.some(a=>a.action==='type' && !Object.hasOwn(a.extra || {},'keptFocus'))) continue;
 let selected = false, risk = false, confidence = 'possible: CLI arguments were not saved';
 const events = join(dir,'player-events.jsonl');
 if (r.player?.startsWith('codex:') && existsSync(events)) {
  confidence = 'Select All followed by explicit type --ref';
  for (const line of readFileSync(events,'utf8').split('\n').filter(Boolean)) {
   const e = JSON.parse(line), item=e.item;
   if(e.type!=='item.completed' || item?.type!=='command_execution') continue;
   const t=parseInvocation(item.command); if(!t || t[2]!=='--session') continue;
   if(t[4]==='key') selected=selectAll(t[5]);
   else if(t[4]==='click') selected=false;
   else if(t[4]==='type') {if(selected && t.includes('--ref')) risk=true; selected=false;}
  }
 } else {
  for(const a of actions) {
   if(a.action==='key') selected=selectAll(a.target);
   else if(a.action==='click') selected=false;
   else if(a.action==='type') {if(selected) risk=true; selected=false;}
  }
 }
 if(!risk) continue;
 findings.push({file,probe:r.probe,player:r.player,confidence});
 if(flags.mark) {
  const backup=join(dir,'result.pre-selection-fix.json'); if(!existsSync(backup))copyFileSync(file,backup);
  r.executionError ||= 'Legacy harness may clear the selected text when type --ref refocuses a field';
  r.selectionAudit={confidence,reason:'Replay with focus-preserving type; goal/criterion unchanged'};
  writeFileSync(file,JSON.stringify(r,null,2)+'\n');
 }
}
if(flags.out)writeFileSync(resolve(flags.out),JSON.stringify(findings,null,2)+'\n');
console.log(`${findings.length} legacy runs ${flags.mark?'marked for replay':'need review'}`);
