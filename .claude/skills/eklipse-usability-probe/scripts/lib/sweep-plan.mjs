// Sweep guards (phase 10): a preflight table before any full flow sweep, the run plan and token budget written up
// front, and a per-run token log (<out>/sweep-log.jsonl) that the budget and ab-sequential.mjs read.
import { appendFileSync, existsSync, readFileSync, writeFileSync, globSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { readJson } from './common.mjs';
import { median } from './journey.mjs';
import { invalidReason } from './result-validity.mjs';

const lastLine = dir => { const f = join(dir, 'player-last-message.md'); return existsSync(f) ? (readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).at(-1) || '').slice(0, 120) : ''; };

// Read a preflight run dir (1 run per flow), write <dir>/preflight.json and print the table.
export function writePreflight(dir) {
  const rows = globSync(join(resolve(dir), '*/*/*/*/result.json')).sort().map(f => {
    const r = readJson(f), [model, flow, player] = f.split('/').slice(-5, -2);
    return { flow, player, model, pass: !!r.success, steps: r.steps, budgetHit: !!r.budgetHit, lastCheckpoint: r.lastCheckpoint ?? null,
      invalid: invalidReason(r, dirname(f)), tokens: r.tokens ?? null, lastLine: lastLine(dirname(f)), variant: r.variant };
  });
  const preflight = { created: new Date().toISOString(), variant: rows[0]?.variant ?? null, flows: rows };
  writeFileSync(join(resolve(dir), 'preflight.json'), JSON.stringify(preflight, null, 2) + '\n');
  console.log('\nflow | player | pass | steps | last checkpoint | invalid | tokens | player last line');
  for (const r of rows) console.log([r.flow, r.player, r.pass, r.steps + (r.budgetHit ? ' (budget)' : ''), r.lastCheckpoint ?? '-', r.invalid || '-', r.tokens ?? '-', r.lastLine].join(' | '));
  console.log(`\npreflight: ${rows.filter(r => r.pass).length}/${rows.length} pass, ${rows.filter(r => r.invalid).length} invalid. Read the table, then start the sweep with --confirmed-preflight ${resolve(dir)}`);
  return preflight;
}

// The gate: a sweep needs a preflight dir whose preflight.json covers every requested flow.
export function checkPreflight(dir, flows, variant) {
  if (!dir) return { error: 'a flow sweep needs a confirmed preflight: run with --preflight --out <dir> first, read the table, then pass --confirmed-preflight <dir>' };
  const f = join(resolve(dir), 'preflight.json');
  if (!existsSync(f)) return { error: `no preflight.json in ${dir}; run --preflight first` };
  const preflight = readJson(f), missing = flows.filter(id => !preflight.flows.some(r => r.flow === id));
  if (missing.length) return { error: `preflight ${dir} does not cover: ${missing.join(', ')}` };
  return { preflight, warning: (preflight.variant || 'baseline') !== (variant || 'baseline') ? `preflight variant ${preflight.variant} differs from sweep variant ${variant || 'baseline'}` : null };
}

// Run plan before the sweep; the token estimate uses the preflight's tokens per flow when there is one.
export function writeRunPlan(out, { jobs, preflight, tokenBudget, ...rest }) {
  const perFlow = {};
  for (const r of preflight?.flows || []) if (Number.isFinite(r.tokens)) (perFlow[r.flow] ||= []).push(r.tokens);
  const estimate = jobs.every(j => perFlow[j.flow]) ? jobs.reduce((s, j) => s + median(perFlow[j.flow]), 0) : null;
  const plan = { created: new Date().toISOString(), ...rest, runs: jobs.length, tokenBudget: tokenBudget || null, estimatedTokens: estimate };
  writeFileSync(join(out, 'run-plan.json'), JSON.stringify(plan, null, 2) + '\n');
  console.log(`run plan: ${jobs.length} runs, estimate ${estimate ? (estimate / 1e6).toFixed(1) + 'M' : 'unknown'} tokens, budget ${tokenBudget ? (tokenBudget / 1e6).toFixed(1) + 'M' : 'none'}`);
  return plan;
}

// Append one run to the sweep log; returns the tokens spent by this invocation so far.
export function tokenLog(out) {
  let spent = 0;
  return entry => { spent += entry.tokens || 0; appendFileSync(join(out, 'sweep-log.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n'); return spent; };
}

// Step budget: ceil(bestPath x patience), min 4; one-and-done players get at least 8 (Thinh, 28 Oct, D6).
export function stepBudget(bestPathLength, patience, persona) {
  const base = Math.max(4, Math.ceil(bestPathLength * patience));
  const floor = persona === 'one-and-done' ? 8 : 4;
  return { steps: Math.max(floor, base), rule: `ceil(bestPath ${bestPathLength} x patience ${patience}), min ${floor}${persona === 'one-and-done' ? ' (one-and-done floor)' : ''}` };
}
