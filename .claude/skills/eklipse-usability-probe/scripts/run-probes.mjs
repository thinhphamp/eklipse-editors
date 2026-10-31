// Runner: probes x personas x runs. Starts the broker (PID recorded), opens sessions, launches players, judges.
// node run-probes.mjs --probes <files|glob> [--personas top4|all|id,id] [--runs 3] [--max 4] [--variant <id>] [--player claude:sonnet|claude:haiku|codex:gpt-6-luna|manual|claude:sonnet,codex:gpt-6-luna] --out <dir>
// Flows: --flows <id,...> --preflight --out <dir> (1 run per flow, prints a table), then the sweep with
//        --confirmed-preflight <dir> [--token-budget <tokens>] (exit 75 quota, 76 budget spent).
import { resolve, join, basename } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync, existsSync, globSync, renameSync, rmSync, rmdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { parseArgs, readJson, loadProbe, loadFlow, loadBehavior, loadPersona, loadPlayer, allPersonas, call, sleep, REPO, SKILL } from './lib/common.mjs';
import { startBroker, stopBroker, onSignal } from './lib/broker-client.mjs';
import { buildBrief, buildFlowBrief } from './lib/brief.mjs';
import { runPool } from './lib/pool.mjs';
import { modeledTimeSeconds } from './judge.mjs';
import { runClaudePlayer, livePlayers } from './lib/player-claude.mjs';
import { runCodexPlayer } from './lib/player-codex.mjs';
import { invalidReason } from './lib/result-validity.mjs';
import { writePreflight, checkPreflight, writeRunPlan, tokenLog, stepBudget } from './lib/sweep-plan.mjs';

// Provider seam: register another `<provider>:<model>` adapter here when needed.
const flowPlayerProviders = {
  claude: (model, launch) => runClaudePlayer({ model, ...launch }),
  codex: (model, launch) => runCodexPlayer({ model, ...launch }),
};

const { flags, pos } = parseArgs(process.argv.slice(2), ['force', 'resume', 'preflight']);
if (flags.flows) {
  const out = resolve(flags.out || '');
  if (!flags.out) { console.error('--out is required'); process.exit(2); }
  const ids = flags.flows.split(',').filter(Boolean), preflight = !!flags.preflight, models = (flags.player || 'codex:gpt-6-luna').split(',').slice(0, preflight ? 1 : undefined);
  const flowFiles = ids.map(id => join(SKILL, 'flows/claude-improvement', id + '.json'));
  const flows = flowFiles.map(loadFlow), runs = preflight ? 1 : Number(flags.runs || 1), max = Number(flags.max || 4), tokenBudget = Number(flags['token-budget'] || 0);
  if(!Number.isInteger(runs)||runs<1){console.error('--runs must be a positive integer');process.exit(2);}
  if(!Number.isInteger(max)||max<1||max>4){console.error('--max must be an integer from 1 to 4');process.exit(2);}
  const jobs = [];
  // Preflight: one run per flow (its first player) on the first model.
  for (const flow of flows) for (const playerId of flow.playerIds.slice(0, preflight ? 1 : undefined)) { const spec=loadPlayer(playerId); if(spec.persona!==flow.persona)throw new Error(`${flow.id}: player ${playerId} has persona ${spec.persona}`); for (const model of models) for (let n = 1; n <= runs; n++) {
    const behavior = loadBehavior(spec.behavior), scenario = (readJson(join(SKILL, 'targets', flow.target + '.json')).scenarios || {})[spec.scenario];
    const pathActions = flow.bestPath.map(s => ({ action: s.do, target: s.text || '', extra: {} }));
    const bestTimeSeconds = flow.bestTimeSeconds ?? modeledTimeSeconds(pathActions);
    jobs.push({ flow: { ...flow, start: { ...flow.start, storage: { ...scenario.storage, ...(flow.start.storage || {}) } }, bestTimeSeconds, budget: (b => ({ ...flow.budget, steps: b.steps, budgetRule: b.rule }))(stepBudget(flow.bestPath.length, behavior.patience, spec.persona)) }, spec, behavior, model, n });
  }}
  const pending = jobs.filter(j => {
    const slug=j.model.replace(':','-'), dir=join(out,slug,j.flow.id,j.spec.id,String(j.n)), file=join(dir,'result.json');
    if(!existsSync(file)) return true;
    if(flags.resume){try{return !!invalidReason(readJson(file),dir);}catch{return true;}}
    if(!flags.force){console.error(`result exists: ${file}; use --resume or --force`);process.exit(1);}
    return true;
  });
  if (!pending.length) { console.log('all flow runs already valid'); process.exit(0); }
  let gate = {};
  if (!preflight) { gate = checkPreflight(flags['confirmed-preflight'], ids, flags.variant); if (gate.error) { console.error(gate.error); process.exit(2); } if (gate.warning) console.log('WARNING ' + gate.warning); }
  mkdirSync(out, { recursive: true });
  writeRunPlan(out, { mode: preflight ? 'preflight' : 'sweep', flows: ids, players: models, runsPerPair: runs, variant: flags.variant || 'baseline', preflightDir: preflight ? null : resolve(flags['confirmed-preflight']), tokenBudget, jobs: pending.map(j => ({ flow: j.flow.id, player: j.spec.id, model: j.model, n: j.n, budget: { steps: j.flow.budget.steps, rule: j.flow.budget.budgetRule } })) });
  const b = await startBroker(out, { max, apiPort: Number(flags['api-port'] || 4391) });
  const logRun = tokenLog(out);
  let failures=0, quota=false, budgetSpent=false;
  try {
    const bestTimes=new Map();
    for(const j of pending){if(bestTimes.has(j.flow.id))continue;
      const bestDir=join(out,'.best-path',j.flow.id);mkdirSync(bestDir,{recursive:true});
      const {id:bestId}=await call(b.apiPort,'/session',{probe:j.flow,persona:loadPersona(j.flow.persona),runDir:bestDir,runId:`bestpath/${j.flow.id}`,clip:j.flow.input?.clip||null,variant:flags.variant||''},b.token);
      let bestError=null;for(const [i,step] of j.flow.bestPath.entries()){try{await call(b.apiPort,`/s/${bestId}/play-step`,step,b.token);}catch(e){bestError=`step ${i+1}: ${e.message}`;break;}}
      const bestResult=await call(b.apiPort,`/s/${bestId}/judge`,{},b.token);bestTimes.set(j.flow.id,bestResult.modeledTimeSeconds);
      if(!bestResult.success||bestError){console.error(`best path failed ${j.flow.id}: ${bestError||JSON.stringify(bestResult.checkpoints)}`);failures++;}
    }
    // Up to --max players at once (flow mode ran serially until 27 Oct); stop taking jobs after a quota error.
    const queue=[...pending];
    const runJob=async j=>{
      j.flow.bestTimeSeconds=bestTimes.get(j.flow.id);
      const slug=j.model.replace(':','-'), dir=join(out,slug,j.flow.id,j.spec.id,String(j.n));
      if(flags.resume && existsSync(dir)){const archive=join(out,'.attempts',j.flow.id,j.spec.id,`${j.n}-${Date.now()}`);mkdirSync(join(archive,'..'),{recursive:true});renameSync(dir,archive);}
      mkdirSync(dir,{recursive:true});
      const {id}=await call(b.apiPort,'/session',{probe:j.flow,persona:loadPersona(j.flow.persona),runDir:dir,runId:`${slug}/${j.flow.id}/${j.spec.id}/${j.n}`,variant:flags.variant||'',clip:j.flow.input?.clip||null},b.token);
      // Player cwd outside the repo (phase 10): Codex would otherwise load the repo AGENTS.md into every request.
      const cwd=join(tmpdir(),'probe-player',randomBytes(6).toString('hex'));
      try {
        const persona=loadPersona(j.flow.persona), brief=buildFlowBrief({persona,behavior:j.behavior,mission:j.flow.mission,missionExtra:j.flow.input?.missionExtra,sessionId:id}); writeFileSync(join(dir,'brief.md'),brief);
        const launch={brief,runDir:dir,shotsDir:join(dir,'shots'),cwd,brokerPort:b.apiPort,timeoutMs:2*j.flow.budget.minutes*60000}; mkdirSync(launch.cwd,{recursive:true});
        let meta={player:j.model,flow:j.flow.id,playerId:j.spec.id,persona:j.flow.persona,behavior:j.spec.behavior,clip:j.flow.input?.clip||null,scenario:j.spec.scenario,variant:flags.variant||'baseline'};
        const [provider, model] = j.model.split(':',2), runPlayer=flowPlayerProviders[provider];
        if(!model||!runPlayer)throw new Error(`Unsupported player provider: ${j.model}`);
        meta={...meta,...await runPlayer(model,launch)};
        const result=await call(b.apiPort,`/s/${id}/judge`,{meta},b.token);
        result.flow=j.flow.id; result.playerId=j.spec.id; result.persona=j.flow.persona; result.clip=j.spec.clip||null; result.modeledTimeSeconds=result.modeledTimeSeconds;
        writeFileSync(join(dir,'result.json'),JSON.stringify(result,null,2)); if(invalidReason(result,dir)) failures++;
        const spent=logRun({run:`${slug}/${j.flow.id}/${j.spec.id}/${j.n}`,tokens:result.tokens||0,success:result.success,invalid:invalidReason(result,dir)});
        if(tokenBudget&&spent>=tokenBudget&&!budgetSpent){budgetSpent=true;console.log(`BUDGET spent ${spent} of ${tokenBudget} tokens; no new runs start`);}
        if(meta.rateLimited){quota=true;console.log(`ERROR quota: ${meta.retryMessage}`);return;}
        console.log(`done ${j.flow.id}/${j.spec.id} ${j.model} #${j.n} success=${result.success} steps=${result.steps} modeled=${result.modeledTimeSeconds}`);
      } finally { rmSync(cwd,{recursive:true,force:true}); await call(b.apiPort,`/s/${id}/abort`,{},b.token).catch(()=>{}); }
    };
    await runPool(queue,max,runJob,()=>quota||budgetSpent);
  } finally { console.log(await stopBroker(b)); }
  if (preflight) writePreflight(out);
  process.exitCode=quota?75:budgetSpent?76:failures?1:0; process.exit();
}
const spec = [flags.probes, ...pos].filter(Boolean).flatMap(s => s.split(',')).flatMap(s => (s.includes('*') ? globSync(s) : [s]));
if (!spec.length || !flags.out) { console.log('usage: run-probes.mjs --probes <files|glob> [--personas top4|all|id,id] [--runs 3] [--max 4] [--player claude:<model>|codex:<model>|manual] --out <dir>'); process.exit(2); }
const out = resolve(flags.out), runs = Number(flags.runs || 3), max = Number(flags.max || 4);
if (!Number.isInteger(max) || max < 1 || max > 4) { console.log('--max must be an integer from 1 to 4'); process.exit(2); }
if (!Number.isInteger(runs) || runs < 1) { console.log('--runs must be a positive integer'); process.exit(2); }
const player = flags.player || 'claude:sonnet', pf = flags.personas || 'top4';
// Several players (`--player claude:sonnet,codex:gpt-6-luna`): one run per player, one after the other, each into
// <out>/<player-slug>/, so every player gets the same probes, personas and broker limits. score.mjs compares them.
if (player.includes(',')) {
  const { spawnSync } = await import('node:child_process');
  const rest = process.argv.slice(2).filter((a, i, all) => a !== '--player' && all[i - 1] !== '--player' && a !== '--out' && all[i - 1] !== '--out');
  let failed = 0;
  for (const p of player.split(',')) {
    console.log(`== player ${p}`);
    const r = spawnSync(process.execPath, [process.argv[1], ...rest, '--player', p, '--out', join(out, p.replace(':', '-'))], { stdio: 'inherit' });
    if (r.status !== 0) failed++;
    if (r.signal) process.exit(1); // interrupted: stop, do not start the next player
  }
  process.exit(failed ? 1 : 0);
}
const probes = spec.map(f => loadProbe(resolve(f)));
const ranked = allPersonas();
const wanted = id => pf === 'all' || (pf === 'top4' ? (ranked.find(p => p.id === id) || {}).rank <= 4 : pf.split(',').includes(id));
const jobs = [];
for (const probe of probes) for (const pid of probe.personaRefs.filter(wanted)) for (let n = 1; n <= runs; n++) jobs.push({ probe, persona: loadPersona(pid), n });
if (!jobs.length) { console.log('no probe x persona matches the --personas filter'); process.exit(1); }

const dup = jobs.filter(j => existsSync(join(out, j.probe.id, j.persona.id, String(j.n), 'result.json')));
if (dup.length && !flags.force && !flags.resume) { console.log(`${dup.length} run(s) already have result.json in ${out}; use --resume to preserve valid runs or --force`); process.exit(1); }
const pending = jobs.filter(j => {
  const dir = join(out, j.probe.id, j.persona.id, String(j.n)), f = join(dir, 'result.json');
  if (!existsSync(f) || !flags.resume) return true;
  try { return !!invalidReason(readJson(f), dir); } catch { return true; }
});
if (!pending.length) { console.log(`all ${jobs.length} runs already valid`); process.exit(0); }
console.log(`${pending.length}/${jobs.length} runs pending`);

const b = await startBroker(out, { max, apiPort: Number(flags['api-port'] || 4391) });
const rows = [];
let quotaError = false, playerUnavailable = false, errors = 0;
const lastDone = dir => { const f = join(dir, 'actions.jsonl'); return existsSync(f) && readFileSync(f, 'utf8').split('\n').some(l => /"action":"(done|giveup)"|"outcome":"stopped"/.test(l)); };

async function oneRun({ probe, persona, n }) {
  const runDir = join(out, probe.id, persona.id, String(n));
  if (flags.resume && existsSync(runDir)) {
    const archive = join(out, '.attempts', probe.id, persona.id, `${n}-${Date.now()}`);
    mkdirSync(join(archive, '..'), { recursive: true });
    renameSync(runDir, archive);
  }
  mkdirSync(runDir, { recursive: true });
  rmSync(join(runDir, 'actions.jsonl'), { force: true });
  const runId = `${basename(out)}/${probe.id}/${persona.id}/${n}`;
  // Everything the player can see lives under an opaque folder (no probe or persona id in any path).
  const opaque = join(out, '.p', randomBytes(6).toString('hex')), shotsDir = join(opaque, 'shots');
  mkdirSync(shotsDir, { recursive: true });
  const { id } = await call(b.apiPort, '/session', { probe, persona, runDir, runId, shotsDir, variant: flags.variant || probe.variant || '' }, b.token);
  try {
    const brief = buildBrief({ persona, probe, sessionId: id });
    writeFileSync(join(runDir, 'brief.md'), brief);
    const limitMs = 2 * probe.budget.minutes * 60000;
    let meta = { player, scenario: probe.scenario || 'demo', variant: flags.variant || probe.variant || 'baseline' };
    const launch = { brief, runDir, shotsDir, cwd: join(tmpdir(), 'probe-player', basename(opaque)), brokerPort: b.apiPort, timeoutMs: limitMs };
    if (player.startsWith('claude:')) meta = { ...meta, ...(await runClaudePlayer({ model: player.slice(7), ...launch })) };
    else if (player.startsWith('codex:')) meta = { ...meta, ...(await runCodexPlayer({ model: player.slice(6), ...launch })) };
    else {
      console.log(`RUN ${runDir} SESSION ${id}`);
      const t0 = Date.now();
      while (Date.now() - t0 < limitMs && !lastDone(runDir)) await sleep(5000);
    }
    const r = await call(b.apiPort, `/s/${id}/judge`, { meta }, b.token);
    rows.push(r);
    if (invalidReason(r, runDir)) errors++;
    if (meta.rateLimited) { quotaError = true; console.log(`ERROR: quota exhausted; stopping new jobs: ${meta.retryMessage}`); }
    else if (meta.error || meta.executionError) { playerUnavailable = true; console.log(`ERROR: player execution failed; stopping new jobs: ${meta.error || meta.executionError}`); }
    console.log(`done ${probe.id} ${persona.id} #${n} success=${r.success} steps=${r.steps}`);
  } catch (e) {
    await call(b.apiPort, `/s/${id}/abort`, {}, b.token).catch(() => {}); // give the slot back
    throw e;
  } finally {
    rmSync(join(runDir, 'shots'), { recursive: true, force: true });
    if (existsSync(shotsDir)) renameSync(shotsDir, join(runDir, 'shots'));
    rmSync(opaque, { recursive: true, force: true });
    rmSync(join(tmpdir(), 'probe-player', basename(opaque)), { recursive: true, force: true });
  }
}

onSignal(async () => {
  for (const pid of livePlayers) { try { process.kill(pid, 'SIGTERM'); } catch {} }
  console.log(await stopBroker(b));
});

try {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(max, pending.length) }, async () => {
    while (!quotaError && !playerUnavailable && next < pending.length) { const j = pending[next++]; try { await oneRun(j); } catch (e) { errors++; console.log(`ERROR ${j.probe.id} ${j.persona.id} #${j.n}: ${e.message}`); } }
  }));
} finally {
  console.log(await stopBroker(b));
  try { rmdirSync(join(out, '.p')); } catch {} // empty once every run has moved its shots
}
console.log('\nprobe | persona | run | success | steps | stepRatio | gaveUp');
for (const r of rows.sort((a, c) => a.runId.localeCompare(c.runId))) {
  const [, probe, persona, n] = r.runId.split('/');
  console.log(`${probe} | ${persona} | ${n} | ${r.success} | ${r.steps} | ${r.stepRatio} | ${r.gaveUp}`);
}
writeFileSync(join(out, 'summary.json'), JSON.stringify(rows, null, 2));
process.exitCode = quotaError ? 75 : errors ? 1 : 0;
