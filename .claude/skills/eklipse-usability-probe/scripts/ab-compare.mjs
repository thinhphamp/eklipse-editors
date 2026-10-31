#!/usr/bin/env node
// A/B: compares a variant sweep with baseline sweeps per probe × player and applies the keep rule (phase 7):
// keep when the target probes gain ≥ 10 success points or the step ratio drops ≥ 20%, no held-out probe gets worse,
// and no regression probe loses more than 10 points. Appends the verdict to variants.json.
// Usage: node ab-compare.mjs --variant <id> --dir <variant-sweep> --baseline <dir>[,<dir>...] --target <probe,...>
//        --holdout <probe,...> --regression <probe,...> [--ledger <variants.json>]
import { readFileSync, writeFileSync, existsSync, globSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { parseArgs, SKILL } from './lib/common.mjs';
import { invalidReason } from './lib/result-validity.mjs';
import { journeyKeep, readTree, summarizeTree } from './lib/journey.mjs';

const { flags } = parseArgs(process.argv.slice(2));
if (flags.journey) {
  if(!flags.dir||!flags.baseline){console.error('usage: ab-compare.mjs --journey --dir <variant-run> --baseline <baseline-run>');process.exit(2);}
  const base=readTree(flags.baseline), vari=readTree(flags.dir), models=[...new Set([...base.values(),...vari.values()].map(r=>r.model))], report={models:{}};
  for(const model of models){const b=[...base.values()].filter(r=>r.model===model),v=[...vari.values()].filter(r=>r.model===model);const keys=b.map(r=>`${r.flow}/${r.player}/${r.n}`).filter(k=>v.some(x=>`${x.flow}/${x.player}/${x.n}`===k));
    const matchedB=b.filter(r=>keys.includes(`${r.flow}/${r.player}/${r.n}`)),matchedV=v.filter(r=>keys.includes(`${r.flow}/${r.player}/${r.n}`));
    const bs=summarizeTree(matchedB),vs=summarizeTree(matchedV),verdict=keys.length!==new Set(v.map(r=>`${r.flow}/${r.player}/${r.n}`)).size?{verdict:'incomplete',reasons:['A/B run cells are not fully matched']}:journeyKeep(bs,vs);
    report.models[model]={matched:keys.length,baseline:bs,variant:vs,...verdict};
  }
  const main=models.includes('codex-gpt-6-luna')?'codex-gpt-6-luna':models[0], mainVerdict=report.models[main]?.verdict; if(models.length>1)for(const model of models.filter(m=>m!==main))report.models[model].check=report.models[model].verdict==='drop'?'flag':'clear';
  report.verdict=mainVerdict||'incomplete';writeFileSync(join(resolve(flags.dir),'journey-ab-compare.json'),JSON.stringify(report,null,2)+'\n');
  console.log('model | matched | baseline | variant | verdict | check');for(const [model,r] of Object.entries(report.models))console.log(`${model} | ${r.matched} | ${r.baseline.overall?.toFixed(1)??'-'} | ${r.variant.overall?.toFixed(1)??'-'} | ${r.verdict} | ${r.check||'-'}`);
  console.log(`verdict: ${report.verdict}`);process.exit(report.verdict==='incomplete'?2:0);
}
const list = s => (s || '').split(',').filter(Boolean);
const [target, holdout, regression] = [list(flags.target), list(flags.holdout), list(flags.regression)];
if (!flags.variant || !flags.dir || !flags.baseline || !target.length) { console.error('see usage in the header'); process.exit(2); }

// Dedupe repeated cells across baseline directories; a later valid run wins.
const exclusions = [];
function load(dirs) {
  const cells = new Map();
  for (const d of dirs) for (const f of globSync(join(resolve(d), '*/*/*/*/result.json'))) {
    const [player, probe, persona, n] = f.split('/').slice(-5, -1), r = JSON.parse(readFileSync(f, 'utf8'));
    const reason = invalidReason(r, dirname(f));
    if (reason) { exclusions.push({ file: f, reason }); continue; }
    cells.set([player, probe, persona, n].join('/'), { ...r, playerSlug: player, persona, n });
  }
  const m = {};
  for (const r of cells.values()) ((m[r.probe] ||= {})[r.playerSlug] ||= []).push(r);
  return m;
}
const median = xs => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const stats = rs => rs?.length ? { n: rs.length, success: Math.round(100 * rs.filter(r => r.success).length / rs.length), successRate: 100 * rs.filter(r => r.success).length / rs.length,
  ratio: median(rs.filter(r => r.success).map(r => r.stepRatio).filter(Number.isFinite)) } : null;

const base = load(list(flags.baseline)), vari = load([flags.dir]);
const rows = [], problems = [], missing = [];
const players = list(flags.players || 'claude-sonnet,codex-gpt-6-luna');
const expectedRuns = Number(flags.runs || 3);
if (!Number.isInteger(expectedRuns) || expectedRuns < 1) throw new Error('--runs must be a positive integer');
let gain = false;
for (const [role, probes] of [['target', target], ['holdout', holdout], ['regression', regression]]) for (const probe of probes) {
  const spec = JSON.parse(readFileSync(join(SKILL, 'probes', 'claude-improvement', probe + '.json'), 'utf8'));
  const expected = spec.personaRefs.flatMap(persona => Array.from({ length: expectedRuns }, (_, n) => `${persona}/${n + 1}`));
  for (const player of players) {
    const bRuns = base[probe]?.[player] || [], vRuns = vari[probe]?.[player] || [];
    const key = r => `${r.persona}/${r.n}`;
    const bMap = new Map(bRuns.map(r => [key(r), r])), vMap = new Map(vRuns.map(r => [key(r), r]));
    const matched = expected.filter(k => bMap.has(k) && vMap.has(k) && (bMap.get(k).scenario || 'demo') === (vMap.get(k).scenario || 'demo'));
    if (matched.length !== expected.length) missing.push(`${probe}/${player}: ${matched.length}/${expected.length} matched valid runs`);
    const b = stats(matched.map(k => bMap.get(k))), v = stats(matched.map(k => vMap.get(k)));
    const d = b && v ? v.success - b.success : null;
    const exactDelta = b && v ? v.successRate - b.successRate : null;
    const exactRatioDrop = b?.ratio && v?.ratio ? 100 * (b.ratio - v.ratio) / b.ratio : null;
    const ratioDrop = exactRatioDrop === null ? null : Math.round(exactRatioDrop);
    rows.push({ role, probe, player, baseline: b, variant: v, expected: expected.length, matched: matched.length, deltaSuccess: d, ratioDropPct: ratioDrop });
    if (!b || !v) continue;
    if (role === 'target' && (exactDelta >= 10 || (exactDelta >= 0 && exactRatioDrop !== null && exactRatioDrop >= 20))) gain = true;
    if (role === 'holdout' && exactDelta < 0) problems.push(`held-out ${probe}/${player} got worse (${d} points)`);
    if (role === 'regression' && exactDelta < -10) problems.push(`regression ${probe}/${player} lost ${-d} points`);
  }
}
const verdict = missing.length ? 'incomplete' : gain && !problems.length ? 'keep' : 'drop';
const entry = { variant: flags.variant, date: new Date().toISOString().slice(0, 10), verdict,
  reasons: missing.length ? ['Required matched samples are incomplete; no keep/drop decision yet'] : gain ? problems : ['no clear gain on target probes', ...problems],
  warnings: missing, exclusions, players, runsPerCell: expectedRuns, roles: { target, holdout, regression }, rows, baseline: list(flags.baseline), dir: resolve(flags.dir) };

const ledger = resolve(flags.ledger || join(flags.dir, '..', 'variants.json'));
const all = existsSync(ledger) ? JSON.parse(readFileSync(ledger, 'utf8')) : [];
writeFileSync(ledger, JSON.stringify([...all.filter(e => e.variant !== flags.variant), entry], null, 2) + '\n');

const fmt = s => s ? `${s.success}% (n${s.n}, ${s.ratio ?? '-'}x)` : '-';
console.log(`role | probe | player | baseline | ${flags.variant} | Δ success`);
rows.forEach(r => console.log([r.role, r.probe, r.player, fmt(r.baseline), fmt(r.variant), r.deltaSuccess ?? '-'].join(' | ')));
console.log(`\nverdict: ${verdict.toUpperCase()}${entry.reasons.length ? ' (' + entry.reasons.join('; ') + ')' : ''}${entry.warnings.length ? '\nwarnings: ' + entry.warnings.join('; ') : ''}\nledger: ${ledger}`);
