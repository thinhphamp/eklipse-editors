// Regression: the GIFs chip scrolls ~2000 px; the returned GG ref must hit GG.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import { startBroker, stopBroker } from '../lib/broker-client.mjs';
import { SKILL, loadProbe, loadPersona, call } from '../lib/common.mjs';
const out = process.argv[2];
if (!out) throw new Error('provide an evidence output directory');
const broker = await startBroker(out, { max: 1 });
try {
  for (let n = 1; n <= 3; n++) {
    const probe = loadProbe(join(SKILL, 'probes/claude-improvement/elements-add-gg-gif.json'));
    const runDir = join(out, String(n)); mkdirSync(runDir, { recursive: true });
    const { id } = await call(broker.apiPort, '/session', { probe, persona: loadPersona('first-clip-newcomer'), runDir, runId: `scroll-regression/${n}`, variant: 'el-jump' }, broker.token);
    const act = body => call(broker.apiPort, `/s/${id}/act`, body);
    await act({ action: 'look' });
    await act({ action: 'click', target: 'Elements' });
    const { text } = await act({ action: 'click', target: 'GIFs' });
    const ref = text.match(/^\[(\d+)\] button "GG"$/m)?.[1];
    assert.ok(ref, text);
    await act({ action: 'click', ref });
    const result = await call(broker.apiPort, `/s/${id}/judge`, { meta: {} }, broker.token);
    assert.equal(result.executionError, undefined);
    assert.equal(result.success, true, JSON.stringify(result));
    const actions = readFileSync(join(runDir, 'actions.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(actions.at(-1).extra.name, 'GG');
    console.log(`PASS smooth-scroll GG ref #${n}`);
  }
} finally { console.log(await stopBroker(broker)); }
