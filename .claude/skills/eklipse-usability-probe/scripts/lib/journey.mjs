import { readFileSync, existsSync, globSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { SKILL } from './common.mjs';
import { invalidReason } from './result-validity.mjs';
export const median = xs => { if (!xs.length) return null; const s=[...xs].sort((a,b)=>a-b),m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2; };
export const mean = xs => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
export function summarize(rs) {
  const failed={}; for(const r of rs) for(const [id,ok] of Object.entries(r.checkpoints||{})) if(!ok) failed[id]=(failed[id]||0)+1;
  return { runs:rs.length, success:rs.filter(r=>r.success).length, successRate:rs.length?rs.filter(r=>r.success).length/rs.length:null,
    medianClicks:median(rs.map(r=>r.clicks??r.actions?.filter(a=>a.action==='click').length).filter(Number.isFinite)),
    medianModeledTime:median(rs.map(r=>r.modeledTimeSeconds).filter(Number.isFinite)), meanJourneyScore:mean(rs.map(r=>r.journeyScore).filter(Number.isFinite)),
    stuckCheckpoints:failed, notes:rs.flatMap(r=>r.notes||[]).slice(0,3) };
}
export function weighted(rows, weightKey='weight') {
  const valid=rows.filter(r=>Number.isFinite(r.meanJourneyScore)); const total=valid.reduce((s,r)=>s+(r[weightKey]||0),0);
  return total ? valid.reduce((s,r)=>s+r.meanJourneyScore*(r[weightKey]||0),0)/total : null;
}
export function journeyKeep(baseline, variant) {
  if (variant.overall == null || baseline.overall == null) return { verdict:'incomplete', reasons:['overall score missing'] };
  const reasons=[];
  if (variant.overall-baseline.overall < 5) reasons.push('overall score gain is below 5 points');
  for(const [persona,score] of Object.entries(baseline.personas||{})) if(score!=null && variant.personas?.[persona]!=null && variant.personas[persona]-score < -3) reasons.push(`${persona} drops more than 3 points`);
  for(const [flow,stats] of Object.entries(baseline.flows||{})) if(stats?.successRate!=null && variant.flows?.[flow]?.successRate!=null && variant.flows[flow].successRate < stats.successRate) reasons.push(`${flow} success rate drops`);
  return { verdict:reasons.length?'drop':'keep', reasons };
}

// Valid flow results of a run dir, keyed `<model>/<flow>/<player>/<n>` (shared by ab-compare and ab-sequential).
export function readTree(root) {
  const cells=new Map();
  for(const model of globSync(join(resolve(root),'*'))){if(!existsSync(model))continue;const m=model.split('/').at(-1);
    for(const f of globSync(join(model,'*/*/*/result.json'))){const [flow,player,n]=f.split('/').slice(-4,-1);try{const r=JSON.parse(readFileSync(f,'utf8'));if(!invalidReason(r,dirname(f)))cells.set(`${m}/${flow}/${player}/${n}`,{...r,model:m,flow,player,n});}catch{}}
  }return cells;
}
const PERSONA_WEIGHTS={'quick-user':.45,'one-and-done':.30,'heavy-editor':.25};
// Flow -> persona -> weighted overall score for one model's runs; the input of journeyKeep.
export function summarizeTree(rs) {
  const flows={},personas={};for(const flow of [...new Set(rs.map(r=>r.flow))]){const group=rs.filter(r=>r.flow===flow);flows[flow]=summarize(group);const spec=JSON.parse(readFileSync(join(SKILL,'flows/claude-improvement',flow+'.json'),'utf8'));flows[flow].weight=spec.weight/(spec.playerIds?.length||1);flows[flow].persona=spec.persona;}
  for(const persona of [...new Set(Object.values(flows).map(x=>x.persona))])personas[persona]=weighted(Object.values(flows).filter(x=>x.persona===persona));
  return {flows,personas,overall:weighted(Object.entries(personas).map(([id,meanJourneyScore])=>({meanJourneyScore,weight:PERSONA_WEIGHTS[id]||0})))};
}
