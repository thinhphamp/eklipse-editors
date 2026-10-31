#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarize, weighted } from './lib/journey.mjs';
import { invalidReason } from './lib/result-validity.mjs';
const skill=resolve(dirname(fileURLToPath(import.meta.url)),'..'), root=resolve(process.argv[2]||'');
if(!process.argv[2]||!existsSync(root)){console.error('usage: node journey-score.mjs <run-dir>');process.exit(2);}
const dirs=p=>readdirSync(p).filter(x=>!x.startsWith('.')&&statSync(join(p,x)).isDirectory());
const output={generated:new Date().toISOString(),models:{}};
for(const model of dirs(root)){
 const modelDir=join(root,model), runs=[];
 for(const flow of dirs(modelDir)) for(const player of dirs(join(modelDir,flow))) for(const n of dirs(join(modelDir,flow,player))){
  const file=join(modelDir,flow,player,n,'result.json'); if(!existsSync(file))continue;
  try{const r=JSON.parse(readFileSync(file,'utf8')); if(!invalidReason(r,dirname(file))) runs.push(r);}catch{}
 }
 const group=(key)=>Object.entries(Object.groupBy(runs,key)).map(([id,rs])=>({id,...summarize(rs)}));
 const players=group(r=>r.playerId), flowGroups=group(r=>r.flow), personaGroups=group(r=>r.persona);
 const flowSpecs=Object.fromEntries(flowGroups.map(f=>{const spec=JSON.parse(readFileSync(join(skill,'flows/claude-improvement',f.id+'.json'),'utf8'));return [f.id,{...f,weight:spec.weight/(spec.playerIds?.length||1),flowWeight:spec.weight,persona:spec.persona}]}));
 const personas={}; for(const p of personaGroups){const rows=Object.values(flowSpecs).filter(f=>f.persona===p.id).map(f=>({...f,meanJourneyScore:flowGroups.find(x=>x.id===f.id)?.meanJourneyScore,weight:f.weight}));personas[p.id]={...p,weightedScore:weighted(rows)};}
 const personaWeights={'quick-user':.45,'one-and-done':.30,'heavy-editor':.25};
 const overall=weighted(Object.entries(personas).map(([id,p])=>({meanJourneyScore:p.weightedScore,weight:personaWeights[id]||0})));
 output.models[model]={players,flows:flowGroups,personas,overall};
 console.log(`\n${model}\nplayer | runs | success | median clicks | median modeled s | mean score | stuck checkpoints | notes`);
 for(const p of players) console.log([p.id,p.runs,p.success,p.medianClicks??'-',p.medianModeledTime??'-',p.meanJourneyScore?.toFixed(1)??'-',JSON.stringify(p.stuckCheckpoints),p.notes.join(' / ')].join(' | '));
 console.log('flow | runs | success rate | median clicks | median modeled s | mean score'); for(const f of flowGroups)console.log([f.id,f.runs,f.successRate==null?'-':(100*f.successRate).toFixed(1)+'%',f.medianClicks??'-',f.medianModeledTime??'-',f.meanJourneyScore?.toFixed(1)??'-'].join(' | '));
 console.log('persona | weighted score'); for(const [id,p] of Object.entries(personas))console.log(`${id} | ${p.weightedScore?.toFixed(1)??'-'}`); console.log(`overall | ${overall?.toFixed(1)??'-'}`);
}
writeFileSync(join(root,'journey-scorecard.json'),JSON.stringify(output,null,2)+'\n');
