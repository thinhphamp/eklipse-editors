#!/usr/bin/env node
// Aggregates run results into a scorecard per feature × persona (grading rules: references/metrics.md).
// Usage: node score.mjs <run-dir> [--target claude-improvement]
// Reads <run-dir>/<probe>/<persona>/<n>/result.json, or one such tree per player (<run-dir>/<player>/..., from
// run-probes --player a,b). Writes <run-dir>/scorecard.json and prints the tables; with several players it adds the
// player agreement per cell.
import { readFileSync, readdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { invalidReason } from './lib/result-validity.mjs';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const runDir = args.find(a => !a.startsWith('--'));
const target = args.includes('--target') ? args[args.indexOf('--target') + 1] : 'claude-improvement';
if (!runDir || !existsSync(runDir)) { console.error('usage: node score.mjs <run-dir> [--target <id>]'); process.exit(2); }

const dirs = p => readdirSync(p).filter(d => !d.startsWith('.') && statSync(join(p, d)).isDirectory());
const probeFile = id => join(skill, 'probes', target, id + '.json');
const personaFile = id => join(skill, 'personas', id + '.json');
const median = xs => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (n, d) => d ? Math.round(100 * n / d) : 0;
const order = { 'Good enough': 0, Friction: 1, Blocked: 2 };
const scenarios = (() => { try { return JSON.parse(readFileSync(join(skill, 'targets', target + '.json'), 'utf8')).scenarios || {}; } catch { return {}; } })();
const exclusions = [];

// Grade thresholds (draft, tune in phase 6).
function grade(c) {
  const success = c.successRate / 100, wrong = c.wrongFirstClickRate / 100;
  if (success < 0.5 || c.giveUps > c.runs / 2) return 'Blocked';
  if (success < 0.8 || (c.medianStepRatio ?? 0) > 1.5 || wrong >= 0.3 || c.giveUps > 0) return 'Friction';
  return 'Good enough';
}

function collect(dir) {
  const runs = [];
  for (const probe of dirs(dir)) {
    if (!existsSync(probeFile(probe))) continue;
    const spec = JSON.parse(readFileSync(probeFile(probe), 'utf8'));
    for (const persona of dirs(join(dir, probe))) for (const n of dirs(join(dir, probe, persona))) {
      const f = join(dir, probe, persona, n, 'result.json');
      if (!existsSync(f)) continue;
      try {
        const r = JSON.parse(readFileSync(f, 'utf8'));
        const reason = invalidReason(r, join(dir, probe, persona, n));
        if (reason) { exclusions.push({ file: f, reason }); console.error(`excluded ${f}: ${reason}`); continue; }
        runs.push({ probe, persona, n, feature: spec.feature, scenario: spec.scenario || 'demo', holdout: spec.holdout, ...r });
      } catch (e) { console.error(`skipping ${f}: ${e.message}`); }
    }
  }
  return runs;
}

function cell(rs) {
  const quotes = rs.flatMap(r => (r.notes || []).map(q => ({ q, ok: r.success }))).sort((a, b) => a.ok - b.ok).slice(0, 3).map(x => x.q);
  const c = {
    runs: rs.length, probes: [...new Set(rs.map(r => r.probe))],
    successRate: pct(rs.filter(r => r.success).length, rs.length),
    medianSteps: median(rs.map(r => r.steps).filter(Number.isFinite)),
    medianStepRatio: median(rs.filter(r => r.success).map(r => r.stepRatio).filter(Number.isFinite)),
    wrongFirstClickRate: pct(rs.filter(r => r.wrongFirstClick).length, rs.length),
    giveUps: rs.filter(r => r.gaveUp).length, budgetHits: rs.filter(r => r.budgetHit).length,
    falseDone: rs.filter(r => r.done && !r.success).length,
    medianTokens: median(rs.map(r => r.tokens).filter(Number.isFinite)),
    models: [...new Set(rs.map(r => r.model).filter(Boolean))], quotes,
  };
  return { ...c, grade: grade(c) };
}

const group = (rs, key) => rs.reduce((m, r) => { const k = key(r); (m[k] ||= []).push(r); return m; }, {});

function score(runs) {
  const scorecard = Object.values(group(runs, r => r.feature + '|' + r.persona)).map(rs => {
    const rank = existsSync(personaFile(rs[0].persona)) ? JSON.parse(readFileSync(personaFile(rs[0].persona), 'utf8')).rank : null;
    return { feature: rs[0].feature, persona: rs[0].persona, rank, ...cell(rs) };
  }).sort((a, b) => a.feature.localeCompare(b.feature) || (a.rank ?? 99) - (b.rank ?? 99));
  // Feature grade = worst grade among top-4 personas (all personas when none of the top 4 ran).
  const features = {};
  for (const c of scorecard) {
    const f = features[c.feature] ||= { grade: 'Good enough', cells: 0, top4: false };
    const counts = (c.rank ?? 99) <= 4;
    if (counts && !f.top4) { f.top4 = true; f.grade = 'Good enough'; }
    if ((counts || !f.top4) && order[c.grade] > order[f.grade]) f.grade = c.grade;
    f.cells++;
  }
  // Per probe × user-state scenario × persona: the view for "does this work for a fresh vs a returning user".
  const byScenario = Object.values(group(runs, r => r.probe + '|' + r.persona)).map(rs => ({
    probe: rs[0].probe, scenario: rs[0].scenario, scenarioDescribe: scenarios[rs[0].scenario]?.describe || '', persona: rs[0].persona, ...cell(rs),
  })).sort((a, b) => a.probe.localeCompare(b.probe));
  return { runs: runs.length, features, scorecard, byScenario };
}

const isPlayerDir = d => /^(claude|codex)-/.test(d) && !existsSync(probeFile(d));
const playerDirs = dirs(runDir).filter(isPlayerDir);
const players = playerDirs.length ? Object.fromEntries(playerDirs.map(p => [p, score(collect(join(runDir, p)))])) : { single: score(collect(runDir)) };
const hasValidRuns = Object.values(players).some(p => p.runs);

// Agreement: same feature × persona cell graded by each player.
let agreement = null;
if (playerDirs.length > 1) {
  const keys = [...new Set(Object.values(players).flatMap(p => p.scorecard.map(c => c.feature + '|' + c.persona)))];
  const rows = keys.map(k => {
    const grades = Object.fromEntries(playerDirs.map(p => [p, players[p].scorecard.find(c => c.feature + '|' + c.persona === k)?.grade || '-']));
    const vals = Object.values(grades).filter(g => g !== '-');
    return { cell: k, grades, agree: vals.length > 1 && new Set(vals).size === 1 };
  });
  const pairedCells = rows.filter(r => Object.values(r.grades).filter(g => g !== '-').length > 1).length;
  agreement = { rows, pairedCells, rate: pairedCells ? pct(rows.filter(r => r.agree).length, pairedCells) : null };
}

const out = { generated: new Date().toISOString(), runDir: resolve(runDir), target, status: hasValidRuns ? 'scored-valid-runs' : 'no-valid-runs', exclusions, players, agreement,
  disclaimer: 'An LLM player is a filter, not a user test. Simulated hesitation is not user sentiment.' };
writeFileSync(join(runDir, 'scorecard.json'), JSON.stringify(out, null, 2) + '\n');

for (const [name, p] of Object.entries(players)) {
  console.log(`\n### ${name} (${p.runs} runs)\nfeature | persona | runs | success | step ratio | wrong 1st | give-ups | false done | grade`);
  p.scorecard.forEach(c => console.log([c.feature, c.persona, c.runs, c.successRate + '%', c.medianStepRatio ?? '-', c.wrongFirstClickRate + '%', c.giveUps, c.falseDone, c.grade].join(' | ')));
  console.log('\nprobe | scenario | persona | success | steps | grade');
  p.byScenario.forEach(c => console.log([c.probe, c.scenario, c.persona, c.successRate + '%', c.medianSteps ?? '-', c.grade].join(' | ')));
  console.log('\n' + Object.entries(p.features).map(([f, v]) => `${f}: ${v.grade}`).join('\n'));
}
if (agreement) {
  console.log(`\n### Player agreement: ${agreement.rate === null ? 'not available (no paired cells)' : agreement.rate + '% of cells'}\ncell | ${playerDirs.join(' | ')}`);
  agreement.rows.forEach(r => console.log([r.agree ? r.cell : r.cell + ' (differs)', ...playerDirs.map(p => r.grades[p])].join(' | ')));
}
console.log(`\nwrote ${join(runDir, 'scorecard.json')}`);
if (!hasValidRuns) { console.error(`no valid results under ${runDir}`); process.exitCode = 1; }
