import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { invalidReason } from '../lib/result-validity.mjs';
import { SCRIPTS, SKILL } from '../lib/common.mjs';

test('execution and judge failures are excluded; an ordinary failed task remains valid', () => {
  assert.equal(invalidReason({ success: false, exitCode: 0, steps: 0 }), null);
  for (const r of [{ exitCode: 1 }, { exitCode: null }, { timedOut: true }, { checkError: 'missing state' }, { executionError: '429' }, { offRules: ['cat source'] }]) assert.ok(invalidReason(r));
  const dir = mkdtempSync(join(tmpdir(), 'probe-validity-'));
  try {
    writeFileSync(join(dir, 'player-output.json'), JSON.stringify({ is_error: true, api_error: 'usage_limit_reached' }));
    assert.equal(invalidReason({ exitCode: 0 }, dir), 'usage_limit_reached');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('comparison requires every player and matched persona/repeat; deduplicates baseline cells', () => {
  const dir = mkdtempSync(join(tmpdir(), 'probe-compare-'));
  const probe = 'elements-add-second-platform';
  const spec = JSON.parse(readFileSync(join(SKILL, 'probes/claude-improvement', probe + '.json')));
  const players = ['claude-sonnet', 'codex-gpt-6-luna'];
  const put = (sweep, player, persona, n, success, extra = {}) => {
    const d = join(dir, sweep, player, probe, persona, String(n)); mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'result.json'), JSON.stringify({ probe, persona, success, exitCode: 0, stepRatio: 1, ...extra }));
  };
  const compare = () => {
    const result = spawnSync(process.execPath, [join(SCRIPTS, 'ab-compare.mjs'), '--variant', 'test', '--dir', join(dir, 'variant'), '--baseline', [join(dir, 'base'), join(dir, 'base-copy')].join(','), '--target', probe, '--ledger', join(dir, 'variants.json')], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(readFileSync(join(dir, 'variants.json')))[0];
  };
  try {
    for (const player of players) for (const persona of spec.personaRefs) for (let n = 1; n <= 3; n++) {
      put('base', player, persona, n, false); put('base-copy', player, persona, n, false);
      if (player === players[0]) put('variant', player, persona, n, true);
    }
    assert.equal(compare().verdict, 'incomplete');
    for (const persona of spec.personaRefs) for (let n = 1; n <= 3; n++) put('variant', players[1], persona, n, true);
    let entry = compare(); assert.equal(entry.verdict, 'keep');
    assert.equal(entry.rows[0].baseline.n, spec.personaRefs.length * 3);
    put('variant', players[1], spec.personaRefs[0], 3, false, { exitCode: 1 });
    entry = compare(); assert.equal(entry.verdict, 'incomplete'); assert.equal(entry.exclusions.length, 1);
    put('variant', players[1], spec.personaRefs[0], 3, true, { scenario: 'wrong-history' });
    assert.equal(compare().verdict, 'incomplete');
    for (const player of players) for (const persona of spec.personaRefs) for (let n = 1; n <= 3; n++) put('variant', player, persona, n, false);
    assert.equal(compare().verdict, 'drop');
    for (const player of players) for (const persona of spec.personaRefs) for (let n = 1; n <= 3; n++) {
      put('base', player, persona, n, true, { stepRatio: 5 }); put('base-copy', player, persona, n, true, { stepRatio: 5 });
      put('variant', player, persona, n, true, { stepRatio: 4.01 });
    }
    assert.equal(compare().verdict, 'drop', '19.8% step improvement must not round into a 20% win');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('resume preserves valid runs without opening a browser', () => {
  const dir = mkdtempSync(join(tmpdir(), 'probe-resume-'));
  const probe = 'elements-add-second-platform';
  const spec = JSON.parse(readFileSync(join(SKILL, 'probes/claude-improvement', probe + '.json')));
  try {
    for (const persona of spec.personaRefs) for (let n = 1; n <= 3; n++) {
      const d = join(dir, probe, persona, String(n)); mkdirSync(d, { recursive: true });
      writeFileSync(join(d, 'result.json'), JSON.stringify({ probe, persona, success: false, exitCode: 0 }));
    }
    const result = spawnSync(process.execPath, [join(SCRIPTS, 'run-probes.mjs'), '--probes', join(SKILL, 'probes/claude-improvement', probe + '.json'), '--personas', 'all', '--out', dir, '--resume'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /already valid/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('Claude quota output is execution metadata, including when the CLI exits zero', async () => {
  const { runClaudePlayer, livePlayers } = await import('../lib/player-claude.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'probe-quota-')), previousPath = process.env.PATH;
  const { chmodSync } = await import('node:fs');
  try {
    const cli = join(dir, 'claude');
    writeFileSync(cli, '#!/bin/sh\ncat >/dev/null\nprintf \'%s\' \'{"is_error":true,"api_error":"usage_limit_reached","api_error_status":429,"result":"reset at 14:10"}\'\n'); chmodSync(cli, 0o700);
    process.env.PATH = dir + ':' + previousPath;
    const result = await runClaudePlayer({ model: 'test', brief: 'test fixture', runDir: dir, shotsDir: dir, cwd: join(dir, 'cwd'), brokerPort: 0, timeoutMs: 5000 });
    assert.equal(result.exitCode, 0); assert.equal(result.rateLimited, true);
    assert.equal(result.executionError, 'usage_limit_reached'); assert.match(result.retryMessage, /14:10/);
    assert.ok(invalidReason(result, dir)); assert.equal(livePlayers.size, 0);
  } finally { process.env.PATH = previousPath; rmSync(dir, { recursive: true, force: true }); }
});

test('Codex failed-turn quota events stop the sweep rather than count as a failed goal', async () => {
  const { runCodexPlayer } = await import('../lib/player-codex.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'probe-codex-quota-')), previousPath = process.env.PATH;
  const { chmodSync } = await import('node:fs');
  try {
    const cli = join(dir, 'codex');
    writeFileSync(cli, '#!/bin/sh\nprintf \'%s\\n\' \'{"type":"turn.failed","error":{"message":"429 usage limit reached"}}\'\nexit 1\n'); chmodSync(cli, 0o700);
    process.env.PATH = dir + ':' + previousPath;
    const result = await runCodexPlayer({ model: 'test', brief: 'test fixture', runDir: dir, shotsDir: dir, cwd: join(dir, 'cwd'), brokerPort: 0, timeoutMs: 5000 });
    assert.equal(result.rateLimited, true); assert.match(result.executionError, /429/);
    assert.ok(invalidReason(result));
  } finally { process.env.PATH = previousPath; rmSync(dir, { recursive: true, force: true }); }
});

test('command audit accepts the same CLI through a verified symlink and rejects other programs or shell composition', async () => {
  const { auditCommands } = await import('../lib/command-audit.mjs');
  const { symlinkSync } = await import('node:fs');
  const dir = mkdtempSync(join(tmpdir(), 'probe-alias-'));
  try {
    const alias = join(dir, 'probe.mjs'); symlinkSync(join(SCRIPTS, 'probe.mjs'), alias);
    const valid = [
      `node ${alias} --session test click 4`,
      `/bin/zsh -lc 'node ${alias} --session test note "I am unsure; I will look again."'`,
      `node ${alias} --session test type "a & b" --ref 1`,
      String.raw`/bin/zsh -lc "node ${alias} --session test giveup \"I can't find it.\""`,
    ];
    assert.deepEqual(auditCommands([...valid, 'node .claude/skills/eklipse-usability-probe/scripts/probe.mjs --session test drag 2 7']), []);
    // A mistyped CLI path fails before any code runs, so it is not an off-rules command (27 Oct: 13 luna runs).
    assert.deepEqual(auditCommands(['node /missing/probe.mjs --session test look']), []);
    const invalid = [
      `cat ${alias} --session test look`,
      `node ${alias} --session test look; cat source.ts`,
      `node ${alias} --session test note "$(cat source.ts)"`,
      `node ${alias} --session test look > /tmp/output`,
    ];
    assert.deepEqual(auditCommands(invalid), invalid);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('scoring excludes quota failures and does not invent disagreement when only one player ran', () => {
  const dir = mkdtempSync(join(tmpdir(), 'probe-score-'));
  const probe = 'elements-add-second-platform', persona = 'multi-platform-brand-builder';
  try {
    for (const player of ['claude-sonnet','codex-gpt-6-luna']) {
      const d = join(dir, player, probe, persona, '1'); mkdirSync(d, { recursive: true });
      writeFileSync(join(d, 'result.json'), JSON.stringify({ probe, persona, success: player.startsWith('codex'), exitCode: player.startsWith('codex') ? 0 : 1, steps: 3, stepRatio: 1, notes: [] }));
    }
    let result = spawnSync(process.execPath, [join(SCRIPTS, 'score.mjs'), dir], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    let score = JSON.parse(readFileSync(join(dir,'scorecard.json')));
    assert.equal(score.players['claude-sonnet'].runs, 0); assert.deepEqual(score.players['claude-sonnet'].features, {});
    assert.equal(score.agreement.rate, null); assert.equal(score.agreement.pairedCells, 0); assert.equal(score.exclusions.length, 1);
    const file = join(dir,'codex-gpt-6-luna',probe,persona,'1/result.json');
    const r = JSON.parse(readFileSync(file)); r.exitCode = 1; writeFileSync(file, JSON.stringify(r));
    result = spawnSync(process.execPath, [join(SCRIPTS, 'score.mjs'), dir], { encoding: 'utf8' });
    assert.equal(result.status, 1); score = JSON.parse(readFileSync(join(dir,'scorecard.json')));
    assert.equal(score.status, 'no-valid-runs'); assert.equal(score.players['codex-gpt-6-luna'].runs, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('selection audit marks old refocus sequences, preserves success, and ignores fixed typing logs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'probe-selection-audit-'));
  const run = join(dir,'player/probe/persona/1'); mkdirSync(run,{recursive:true});
  const actions = [{ action:'key',target:'Meta+A',extra:{} },{ action:'type',target:'new-name',extra:{} }];
  const audit = () => {
    const result = spawnSync(process.execPath,[join(SCRIPTS,'audit-selection.mjs'),dir,'--mark','--out',join(dir,'audit.json')],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr); return JSON.parse(readFileSync(join(dir,'audit.json')));
  };
  try {
    writeFileSync(join(run,'result.json'),JSON.stringify({player:'codex:gpt-6-luna',success:true,exitCode:0}));
    writeFileSync(join(run,'actions.jsonl'),actions.map(JSON.stringify).join('\n'));
    const event = command => JSON.stringify({type:'item.completed',item:{type:'command_execution',command}});
    writeFileSync(join(run,'player-events.jsonl'),[
      event(`node ${join(SCRIPTS,'probe.mjs')} --session test key Meta+A`),
      event(`node ${join(SCRIPTS,'probe.mjs')} --session test type new-name --ref 4`),
    ].join('\n'));
    assert.equal(audit().length,1);
    const r=JSON.parse(readFileSync(join(run,'result.json')));
    assert.equal(r.success,true); assert.ok(r.executionError); assert.ok(readFileSync(join(run,'result.pre-selection-fix.json')));
    actions[1].extra={ref:4,keptFocus:true};
    writeFileSync(join(run,'actions.jsonl'),actions.map(JSON.stringify).join('\n'));
    assert.equal(audit().length,0);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('a declared valid variant shortcut is not counted as a wrong first click', async () => {
  const {computeMetrics}=await import('../judge.mjs');
  const probe={bestPath:[{do:'click',selector:'.recent-grid .layout-tile:has-text("Game UI")'}],firstClickAlso:['^Use Game UI$']};
  const click={action:'click',target:'button "Use Game UI"',outcome:'ok',extra:{matchesBestPath:false}};
  assert.equal(computeMetrics([click],probe).wrongFirstClick,false);
  assert.equal(computeMetrics([click],{...probe,firstClickAlso:[]}).wrongFirstClick,true);
  assert.equal(computeMetrics([{...click,target:'button "Apply saved style"'}],probe).wrongFirstClick,true);
});
