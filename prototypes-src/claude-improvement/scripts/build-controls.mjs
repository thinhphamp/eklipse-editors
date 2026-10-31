// Turns a crawl result into src/fixtures/controls/<run>.json (one file per owning run): adds the run that owns
// each control, the catalog row describing the evidence screen, and a status.
// Existing statuses/implementation notes are kept when a key already exists.
// Usage: node scripts/build-controls.mjs <crawl.json> [--only r1|r2|r3|r4]
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';

const crawl = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const catalogPath = new URL('../../../plans/261019-streamladder-web-audit/runs/catalog.tsv', import.meta.url);
const catalog = Object.fromEntries(readFileSync(catalogPath, 'utf8').trim().split('\n').slice(1)
  .map(line => line.split('\t')).map(([id, tab, section, item, action, result]) => [id, `${tab} › ${section} › ${item}: ${result}`]));
const outDir = new URL('../src/fixtures/controls/', import.meta.url);
mkdirSync(outDir, { recursive: true });
const previous = Object.fromEntries(readdirSync(outDir).filter(f => f.endsWith('.json'))
  .flatMap(f => JSON.parse(readFileSync(new URL(f, outDir), 'utf8'))).map(r => [r.key, r]));
// --only <run>: rewrite just that run's file (parallel runs never touch each other's file).
const onlyRun = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : '';

const tabOwner = screen => {
  const s = screen.replace(/^legacy-/, '');
  if (/^E|^x0[5-8]$/.test(s)) return 'r2';
  if (/^C|^x(1[6-9]|20)$/.test(s)) return 'r3';
  if (/^[FA]|^x(09|1[0-5])$/.test(s)) return 'r4';
  return 'r1';
};
const owner = c => (c.region === 'side-panel' || c.region === 'stage' || c.region === 'other') ? tabOwner(c.screen) : 'r1';

const rows = crawl.map(c => {
  const key = `${c.region}|${c.kind}|${c.label}`;
  const old = previous[key] || {};
  const status = old.status && old.status !== 'todo' ? old.status : c.result === 'state' ? 'check' : 'todo';
  return { key, screen: c.screen, screens: c.screens, region: c.region, label: c.label, kind: c.kind, owner: old.owner || owner(c),
    crawl: c.result, toast: c.toast, expected: catalog[c.screen.replace(/^legacy-/, '')] || '', implementation: old.implementation || '', status };
});
for (const run of ['r1', 'r2', 'r3', 'r4']) {
  if (onlyRun && run !== onlyRun) continue;
  const mine = rows.filter(r => r.owner === run);
  const file = new URL(run + '.json', outDir);
  // A partial crawl (--only screens) must not drop rows it did not visit.
  const kept = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).filter(r => !mine.some(m => m.key === r.key)) : [];
  writeFileSync(file, JSON.stringify([...kept, ...mine], null, 1) + '\n');
}
const by = k => Object.entries(rows.reduce((a, r) => (a[r[k]] = (a[r[k]] || 0) + 1, a), {})).map(([n, v]) => `${n}:${v}`).join(' ');
console.log(`rows ${rows.length} | owner ${by('owner')} | crawl ${by('crawl')} | status ${by('status')}`);
