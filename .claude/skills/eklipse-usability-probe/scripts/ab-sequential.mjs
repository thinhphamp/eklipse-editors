#!/usr/bin/env node
// Sequential A/B for one variant (phase 10). Plan in variants/claude-improvement/<id>.json (targets, untouched).
// Live:   node ab-sequential.mjs --variant <id> --baseline <dir> --out <dir> --confirmed-preflight <dir>
//           [--player codex:gpt-6-luna] [--max 4] [--token-budget <tokens>] [--baseline-variant <flag>] [--api-port 4391]
// Replay: node ab-sequential.mjs --variant <id> --baseline <dir> --out <existing-variant-run> --replay [--replay-runs 3]
//         (offline; stage 2 uses at most --replay-runs target runs, because old sweeps stopped at 3)
// Stage 1 runs targets x3 + regression x1 on both sides (run-probes --resume skips valid cells), stops early on a
// clear drop/win, else stage 2 tops targets up to x5. Writes <out>/sequential-ab.json (replay: sequential-replay.json).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs, SCRIPTS } from './lib/common.mjs';
import { readTree, journeyKeep, summarizeTree } from './lib/journey.mjs';
import { loadVariantPlan, stageCells, matchCells, stageOneDecision, finalDecision, STAGE1_TARGET_RUNS, STAGE2_TARGET_RUNS, REGRESSION_RUNS } from './lib/sequential.mjs';

const { flags } = parseArgs(process.argv.slice(2), ['replay']);
if (!flags.variant || !flags.baseline || !flags.out || (!flags.replay && !flags['confirmed-preflight'])) {
  console.error('usage: see the header of ab-sequential.mjs'); process.exit(2);
}
const plan = loadVariantPlan(flags.variant), baseDir = resolve(flags.baseline), out = resolve(flags.out);
const player = flags.player || 'codex:gpt-6-luna', model = player.replace(':', '-'), budget = Number(flags['token-budget'] || 0);
const report = { variant: plan.id, player, targets: plan.targets, regression: plan.regression, untouched: plan.untouched, stages: [] };

const loggedTokens = dir => { const f = join(dir, 'sweep-log.jsonl'); return existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).reduce((s, l) => s + (JSON.parse(l).tokens || 0), 0) : 0; };
const startTokens = { [baseDir]: loggedTokens(baseDir), [out]: loggedTokens(out) };
const spent = () => Object.entries(startTokens).reduce((s, [d, t]) => s + loggedTokens(d) - t, 0);

// One run-probes call; returns its exit code (75 quota, 76 token budget).
function sweep(dir, flows, runs, variantFlag) {
  if (!flows.length) return 0;
  const args = [join(SCRIPTS, 'run-probes.mjs'), '--flows', flows.join(','), '--runs', String(runs), '--max', String(flags.max || 4), '--resume',
    '--player', player, '--out', dir, '--confirmed-preflight', resolve(flags['confirmed-preflight']), '--api-port', String(flags['api-port'] || 4391)];
  if (variantFlag) args.push('--variant', variantFlag);
  if (budget) { const left = budget - spent(); if (left <= 0) return 76; args.push('--token-budget', String(left)); }
  console.log(`== ${dir === out ? 'variant' : 'baseline'} ${flows.join(',')} x${runs}`);
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (r.signal) process.exit(1);
  return r.status;
}
function runStage(targetRuns) {
  for (const [dir, flag] of [[baseDir, flags['baseline-variant']], [out, [...plan.stack, plan.id].join(',')]])
    for (const [flows, runs] of [[plan.targets, targetRuns], [plan.regression, REGRESSION_RUNS]]) {
      const code = sweep(dir, flows, runs, flag);
      if (code === 75 || code === 76) return code === 75 ? 'quota exhausted' : 'token budget spent';
      if (code === 2) return 'run-probes refused to start (arguments or preflight gate; see its message above)';
    }
  return null;
}
const finish = (decision, rule) => {
  Object.assign(report, { decision, rule, variantRuns: report.stages.at(-1)?.cells ?? 0, tokensSpent: flags.replay ? null : spent() });
  if (flags.replay) {
    const full = [...readTree(out).values()].filter(r => r.model === model), base = readTree(baseDir);
    const pairs = full.filter(r => base.has(`${model}/${r.flow}/${r.player}/${r.n}`));
    report.fullSweep = { variantRuns: full.length, matched: pairs.length, ...journeyKeep(summarizeTree(pairs.map(r => base.get(`${model}/${r.flow}/${r.player}/${r.n}`))), summarizeTree(pairs)) };
  }
  writeFileSync(join(out, flags.replay ? 'sequential-replay.json' : 'sequential-ab.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`${plan.id}: ${decision.toUpperCase()} after ${report.stages.length} stage(s), ${report.variantRuns} variant runs — ${rule}`);
  if (report.fullSweep) console.log(`  full sweep: ${report.fullSweep.verdict.toUpperCase()} on ${report.fullSweep.matched} matched of ${report.fullSweep.variantRuns} runs (${report.fullSweep.reasons.join('; ') || 'all checks pass'})`);
  process.exit(decision === 'incomplete' || decision === 'stopped' ? 2 : 0);
};

const stage2Runs = flags.replay ? Math.min(STAGE2_TARGET_RUNS, Number(flags['replay-runs'] || 3)) : STAGE2_TARGET_RUNS;
for (const [stage, targetRuns] of [[1, STAGE1_TARGET_RUNS], [2, stage2Runs]]) {
  if (!flags.replay) { const stop = runStage(targetRuns); if (stop) finish('stopped', `stage ${stage}: ${stop}; rerun the same command to resume`); }
  const cells = stageCells(plan, targetRuns), { b, v, missing } = matchCells(readTree(baseDir), readTree(out), model, cells);
  // Live: a missing cell blocks (rerun resumes it). Replay: old sweeps have a few invalid cells; decide on matched ones.
  const d = missing.length && !flags.replay ? { decision: 'incomplete', rule: `stage ${stage}: ${missing.length} cell(s) without a valid matched run` }
    : stage === 1 ? stageOneDecision(b, v, plan) : finalDecision(b, v);
  report.stages.push({ stage, targetRuns, cells: cells.length, missing, ...d });
  if (d.decision !== 'continue') finish(d.decision, d.rule);
}
