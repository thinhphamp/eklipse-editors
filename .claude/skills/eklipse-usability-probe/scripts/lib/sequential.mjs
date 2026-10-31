// Sequential A/B (phase 10): stage 1 = 3 runs per target pair + 1 run per regression pair. Stop early only on a clear
// drop (Thinh 28 Oct: an early keep matched the full sweep too rarely on night-0011); otherwise stage 2 tops target pairs up to 5 runs and the unchanged journey keep rule decides.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, SKILL } from './common.mjs';
import { mean, journeyKeep, summarizeTree } from './journey.mjs';

export const STAGE1_TARGET_RUNS = 3, STAGE2_TARGET_RUNS = 5, REGRESSION_RUNS = 1;
const FLOWS = join(SKILL, 'flows/claude-improvement');

// variants/claude-improvement/<id>.json: targets, untouched; regression = every other flow.
export function loadVariantPlan(id) {
  const meta = readJson(join(SKILL, 'variants/claude-improvement', id + '.json'));
  const all = readdirSync(FLOWS).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
  for (const f of [...meta.targets, ...meta.untouched]) if (!all.includes(f)) throw new Error(`${id}: unknown flow ${f}`);
  return { ...meta, regression: all.filter(f => !meta.targets.includes(f) && !meta.untouched.includes(f)) };
}

// Expected cells `<flow>/<player>/<n>` for a stage: every player pair of a flow, runs 1..n.
export function stageCells(plan, targetRuns) {
  const cells = [];
  for (const [flows, runs] of [[plan.targets, targetRuns], [plan.regression, REGRESSION_RUNS]])
    for (const flow of flows) for (const player of readJson(join(FLOWS, flow + '.json')).playerIds)
      for (let n = 1; n <= runs; n++) cells.push(`${flow}/${player}/${n}`);
  return cells;
}

// Pick the expected cells of one model from readTree() maps; missing = cells without a valid run on either side.
export function matchCells(base, vari, model, cells) {
  const b = [], v = [], missing = [];
  for (const c of cells) {
    const x = base.get(`${model}/${c}`), y = vari.get(`${model}/${c}`);
    if (x && y) { b.push(x); v.push(y); } else missing.push(`${c} (${!x && !y ? 'both' : !x ? 'baseline' : 'variant'})`);
  }
  return { b, v, missing };
}

const wins = (rs, flows) => rs.filter(r => flows.includes(r.flow) && r.success).length;
const score = (rs, flows) => mean(rs.filter(r => flows.includes(r.flow)).map(r => r.journeyScore).filter(Number.isFinite));

// Stage-1 early stop. Clear drop: target success down 2+ runs AND mean target score down 10+. A promising variant
// always goes on to stage 2: on night-0011 a stage-1 "clear win" (layout-describe) was a drop on the full sweep.
export function stageOneDecision(b, v, plan) {
  const runs = wins(v, plan.targets) - wins(b, plan.targets), points = (score(v, plan.targets) ?? 0) - (score(b, plan.targets) ?? 0);
  const regressionDown = plan.regression.filter(f => wins(v, [f]) < wins(b, [f]));
  const facts = { targetRunsDelta: runs, targetScoreDelta: Math.round(points * 10) / 10, regressionDown };
  if (runs <= -2 && points <= -10) return { decision: 'drop', rule: `clear drop: target success ${runs} runs, score ${facts.targetScoreDelta}`, ...facts };
  return { decision: 'continue', rule: 'no clear result after stage 1', ...facts };
}

// Final decision on the stage-2 set with the unchanged journey keep rule.
export function finalDecision(b, v) {
  const bs = summarizeTree(b), vs = summarizeTree(v), k = journeyKeep(bs, vs);
  return { decision: k.verdict, rule: k.reasons.length ? 'keep rule: ' + k.reasons.join('; ') : 'keep rule: all checks pass', baseline: bs.overall, variant: vs.overall };
}
