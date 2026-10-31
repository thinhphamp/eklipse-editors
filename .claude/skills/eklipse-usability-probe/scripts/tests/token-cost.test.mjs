// Phase 10 guards: sequential A/B early-stop rules, variant plans, preflight gate, run plan and token log.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadVariantPlan, stageCells, matchCells, stageOneDecision } from '../lib/sequential.mjs';
import { checkPreflight, writePreflight, writeRunPlan, tokenLog } from '../lib/sweep-plan.mjs';

const plan = { targets: ['t'], regression: ['r1', 'r2'] };
const runs = (flow, wins, total, score = w => (w ? 80 : 0)) => Array.from({ length: total }, (_, i) => ({ flow, success: i < wins, journeyScore: score(i < wins) }));

test('stage 1 stops on a clear drop only when target runs and score both fall far enough', () => {
  const base = [...runs('t', 4, 6), ...runs('r1', 1, 2), ...runs('r2', 2, 2)];
  const drop = stageOneDecision(base, [...runs('t', 2, 6), ...runs('r1', 1, 2), ...runs('r2', 2, 2)], plan);
  assert.equal(drop.decision, 'drop'); assert.match(drop.rule, /^clear drop: target success -2 runs/);
  const small = stageOneDecision(base, [...runs('t', 3, 6), ...runs('r1', 1, 2), ...runs('r2', 2, 2)], plan);
  assert.equal(small.decision, 'continue');
});

test('stage 1 never keeps early: a clear target gain still goes to stage 2', () => {
  const base = [...runs('t', 1, 6), ...runs('r1', 1, 2), ...runs('r2', 2, 2)];
  const win = stageOneDecision(base, [...runs('t', 4, 6), ...runs('r1', 1, 2), ...runs('r2', 2, 2)], plan);
  assert.equal(win.decision, 'continue');
  const regressed = stageOneDecision(base, [...runs('t', 4, 6), ...runs('r1', 0, 2), ...runs('r2', 2, 2)], plan);
  assert.equal(regressed.decision, 'continue'); assert.deepEqual(regressed.regressionDown, ['r1']);
});

test('variant plans split every flow into targets, regression and untouched', () => {
  const p = loadVariantPlan('look-save');
  assert.deepEqual(p.targets, ['q6-save-and-reuse-look']);
  assert.equal(p.targets.length + p.regression.length + p.untouched.length, readdirSync(new URL('../../flows/claude-improvement/', import.meta.url)).filter(n => n.endsWith('.json')).length);
  assert.ok(!p.regression.some(f => p.untouched.includes(f) || p.targets.includes(f)));
  const cells = stageCells(p, 3);
  assert.equal(cells.filter(c => c.startsWith('q6-')).length, 6); // 2 players x 3 runs
  assert.ok(cells.filter(c => !c.startsWith('q6-')).every(c => c.endsWith('/1')));
});

test('matchCells reports cells missing on either side', () => {
  const r = { success: true };
  const base = new Map([['m/a/p/1', r], ['m/a/p/2', r]]), vari = new Map([['m/a/p/1', r]]);
  const { b, v, missing } = matchCells(base, vari, 'm', ['a/p/1', 'a/p/2', 'a/p/3']);
  assert.equal(b.length, 1); assert.equal(v.length, 1); assert.deepEqual(missing, ['a/p/2 (variant)', 'a/p/3 (both)']);
});

test('a sweep refuses to start without a preflight that covers its flows', () => {
  const dir = mkdtempSync(join(tmpdir(), 'preflight-'));
  try {
    assert.match(checkPreflight(undefined, ['q1']).error, /confirmed preflight/);
    assert.match(checkPreflight(dir, ['q1']).error, /no preflight.json/);
    const run = join(dir, 'codex-gpt-6-luna', 'q1', 'quick-match', '1'); mkdirSync(run, { recursive: true });
    writeFileSync(join(run, 'result.json'), JSON.stringify({ success: false, steps: 9, budgetHit: true, lastCheckpoint: 'layout', tokens: 1000, variant: 'baseline', offRules: ['cat x'] }));
    writeFileSync(join(run, 'player-last-message.md'), 'I tried\nout of steps\n');
    const pf = writePreflight(dir);
    assert.equal(pf.flows[0].invalid, 'player used commands outside the probe CLI'); assert.equal(pf.flows[0].lastLine, 'out of steps');
    assert.match(checkPreflight(dir, ['q1', 'q2']).error, /does not cover: q2/);
    const ok = checkPreflight(dir, ['q1'], 'look-save');
    assert.equal(ok.error, undefined); assert.match(ok.warning, /differs/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('run plan estimates tokens from the preflight and the token log adds up per invocation', () => {
  const dir = mkdtempSync(join(tmpdir(), 'runplan-'));
  try {
    const plan = writeRunPlan(dir, { jobs: [{ flow: 'q1' }, { flow: 'q1' }, { flow: 'h1' }], tokenBudget: 5e6, preflight: { flows: [{ flow: 'q1', tokens: 100 }, { flow: 'h1', tokens: 1000 }] } });
    assert.equal(plan.estimatedTokens, 1200); assert.equal(plan.runs, 3);
    assert.equal(writeRunPlan(dir, { jobs: [{ flow: 'q2' }] }).estimatedTokens, null);
    const log = tokenLog(dir); log({ tokens: 10 }); assert.equal(log({ tokens: 5 }), 15);
    assert.equal(readFileSync(join(dir, 'sweep-log.jsonl'), 'utf8').trim().split('\n').length, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('flow sweeps gate on preflight, honour the token budget and run players outside the repo', () => {
  const src = readFileSync(new URL('../run-probes.mjs', import.meta.url), 'utf8');
  const flowMode = src.slice(src.indexOf('if (flags.flows)'), src.indexOf('const spec = ['));
  assert.match(flowMode, /checkPreflight\(flags\['confirmed-preflight'\]/);
  assert.match(flowMode, /runPool\(queue,max,runJob,\(\)=>quota\|\|budgetSpent\)/);
  assert.match(flowMode, /cwd=join\(tmpdir\(\),'probe-player'/);
  const codex = readFileSync(new URL('../lib/player-codex.mjs', import.meta.url), 'utf8');
  assert.match(codex, /HOME: home, CODEX_HOME: home/); assert.match(codex, /'--disable', 'multi_agent'/); assert.match(codex, /skills\.bundled\.enabled=false/);
});
