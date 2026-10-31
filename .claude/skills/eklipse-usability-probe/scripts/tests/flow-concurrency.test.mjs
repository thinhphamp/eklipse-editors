// Guards the 27 Oct incident: flow mode accepted --max but ran players one at a time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runPool } from '../lib/pool.mjs';

const sleep = ms => new Promise(r => setTimeout(r, ms));

test('runPool runs up to max workers at once and never more', async () => {
  let live = 0, peak = 0, done = 0;
  await runPool([1, 2, 3, 4, 5, 6, 7], 3, async () => { live++; peak = Math.max(peak, live); await sleep(20); live--; done++; });
  assert.equal(peak, 3); assert.equal(done, 7);
});

test('runPool stops taking new items once shouldStop is true', async () => {
  let started = 0, stop = false;
  await runPool([1, 2, 3, 4, 5, 6], 2, async () => { started++; await sleep(10); stop = true; }, () => stop);
  assert.equal(started, 2);
});

test('flow mode in run-probes uses the pool with --max', () => {
  const src = readFileSync(new URL('../run-probes.mjs', import.meta.url), 'utf8');
  const flowMode = src.slice(src.indexOf('if (flags.flows)'), src.indexOf('const spec = ['));
  assert.match(flowMode, /runPool\([^)]*\bmax\b/);
  assert.doesNotMatch(flowMode, /for\s*\(\s*const j of pending\s*\)\s*\{\s*j\.flow\.bestTimeSeconds/);
});
