import test from 'node:test';
import assert from 'node:assert/strict';
import { modeledTimeSeconds } from '../judge.mjs';
import { summarize, weighted, journeyKeep } from '../lib/journey.mjs';

test('modeled time follows action costs and charges new panels and search once',()=>{
  assert.equal(modeledTimeSeconds([
    {action:'click',extra:{newPanel:'layout'}},{action:'click',extra:{newPanel:'layout'}},
    {action:'type',target:'abc',extra:{searchField:true}},{action:'type',target:'x',extra:{searchField:true}},
    {action:'key'},{action:'scroll'},{action:'look'}
  ]), 10);
});

test('a player drag counts as one step and costs 1.5 modeled seconds',()=>{
  assert.equal(modeledTimeSeconds([{action:'drag',target:'meme to timeline'}]),1.5);
});

test('run summary reports successful journeys, medians, checkpoint stalls and three notes',()=>{
  const s=summarize([
    {success:true,clicks:4,modeledTimeSeconds:20,journeyScore:70,checkpoints:{input:true,layout:true},notes:['one']},
    {success:false,clicks:2,modeledTimeSeconds:10,journeyScore:0,checkpoints:{input:true,layout:false},notes:['two','three','four']}
  ]);
  assert.equal(s.successRate,.5);assert.equal(s.medianClicks,3);assert.equal(s.medianModeledTime,15);assert.deepEqual(s.stuckCheckpoints,{layout:1});assert.equal(s.notes.length,3);
});

test('persona and overall weighted scores keep models separate and apply declared weights',()=>{
  assert.equal(weighted([{meanJourneyScore:80,weight:.4},{meanJourneyScore:60,weight:.6}]),68);
  assert.equal(weighted([{meanJourneyScore:80,weight:.45},{meanJourneyScore:60,weight:.3},{meanJourneyScore:40,weight:.25}]),64);
});

test('journey keep rule requires +5 overall and protects personas and flow success',()=>{
  const base={overall:60,personas:{quick:70,heavy:50},flows:{q:{successRate:1}}};
  assert.equal(journeyKeep(base,{overall:65,personas:{quick:68,heavy:51},flows:{q:{successRate:1}}}).verdict,'keep');
  assert.equal(journeyKeep(base,{overall:66,personas:{quick:66,heavy:51},flows:{q:{successRate:1}}}).verdict,'drop');
  assert.equal(journeyKeep(base,{overall:66,personas:{quick:70,heavy:51},flows:{q:{successRate:.5}}}).verdict,'drop');
});

test('flows reference reusable persona players and keep clip-specific inputs on the flow', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { join, resolve } = await import('node:path');
  const skill=resolve('.claude/skills/eklipse-usability-probe');
  const players=readdirSync(join(skill,'players')).filter(x=>x.endsWith('.json')).map(x=>JSON.parse(readFileSync(join(skill,'players',x),'utf8')));
  const flows=readdirSync(join(skill,'flows/claude-improvement')).filter(x=>x.endsWith('.json')).map(x=>JSON.parse(readFileSync(join(skill,'flows/claude-improvement',x),'utf8')));
  assert.equal(players.length,6); assert.ok(flows.length>=13); assert.ok(flows.every(f=>f.playerIds.length>=1));
  assert.ok(flows.every(f=>!('players' in f) && f.input && f.playerIds.every(id=>players.some(p=>p.id===id&&p.persona===f.persona))));
  assert.equal(flows.find(f=>f.flow==='H1').input.missionExtra,'The song you want is not in the music list; you have it as a file.');
  assert.equal(flows.find(f=>f.flow==='Q6').input.clip,'two-clips');
});
