#!/usr/bin/env node
// Recomputes run metrics from saved logs after a metric fix, without replaying players. Success, player meta and
// tokens stay as judged in the browser; only fields from computeMetrics are replaced. Keeps result.orig.json once.
// Usage: node rejudge.mjs <run-dir>   (a sweep dir, with or without player subfolders)
import { readFileSync, writeFileSync, existsSync, globSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { computeMetrics } from './judge.mjs';
import { loadProbe, SKILL } from './lib/common.mjs';

const dir = resolve(process.argv[2] || '');
if (!existsSync(dir)) { console.error('usage: node rejudge.mjs <run-dir>'); process.exit(2); }
let n = 0, changed = 0;
for (const f of globSync(join(dir, '**/result.json'))) {
  if (f.includes('/.attempts/') || f.includes('/.p/')) continue;
  const r = JSON.parse(readFileSync(f, 'utf8'));
  const probeFile = join(SKILL, 'probes', 'claude-improvement', r.probe + '.json');
  const actionsFile = f.replace(/result\.json$/, 'actions.jsonl');
  if (!r.probe || !existsSync(probeFile) || !existsSync(actionsFile)) continue;
  const actions = readFileSync(actionsFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
  const m = computeMetrics(actions, loadProbe(probeFile), { gaveUp: r.gaveUp, done: r.done, budgetHit: r.budgetHit });
  const next = { ...r, ...m, success: r.success };
  if (JSON.stringify(next) !== JSON.stringify(r)) {
    if (!existsSync(f.replace(/\.json$/, '.orig.json'))) copyFileSync(f, f.replace(/\.json$/, '.orig.json'));
    writeFileSync(f, JSON.stringify(next, null, 2) + '\n'); changed++;
  }
  n++;
}
console.log(`rejudged ${n} runs, ${changed} changed`);
