// Verify probes: play each probe's bestPath (scripted, no LLM) with its first persona and judge it.
// Usage: node best-path.mjs <probe.json ...> [--out dir] [--api-port 4391]
import { resolve, join, basename } from 'node:path';
import { parseArgs, readJson, loadProbe, loadFlow, loadPersona, loadPlayer, call, SKILL, hhmm, REPO } from './lib/common.mjs';
import { startBroker, stopBroker, onSignal } from './lib/broker-client.mjs';

const { flags, pos } = parseArgs(process.argv.slice(2));
if (flags.flows) {
  const ids=flags.flows.split(',').filter(Boolean), out=resolve(flags.out||join(REPO,'plans/261027-usability-probe-skill/runs','bestflow-'+hhmm()));
  const b=await startBroker(out,{max:1,apiPort:Number(flags['api-port']||4391)});let fails=0;
  try { for(const id of ids){
    const flow=loadFlow(join(SKILL,'flows/claude-improvement',id+'.json'));
    const tested=new Set(); for(const playerId of flow.playerIds){const player=loadPlayer(playerId); if(tested.has(player.scenario))continue; tested.add(player.scenario); const scenario=(readJson(join(SKILL,'targets',flow.target+'.json')).scenarios||{})[player.scenario];
      const configured={...flow,start:{...flow.start,storage:{...scenario.storage,...flow.start.storage}}}, persona=loadPersona(flow.persona), dir=join(out,id,playerId);
      const {id:sid}=await call(b.apiPort,'/session',{probe:configured,persona,runDir:dir,runId:`bestflow/${id}/${playerId}`,clip:flow.input?.clip||null,variant:flags.variant||''},b.token);let failed=null;
      for(const [i,step] of flow.bestPath.entries()){try{await call(b.apiPort,`/s/${sid}/play-step`,step,b.token);}catch(e){failed=`step ${i+1}: ${e.message}`;break;}}
      const r=await call(b.apiPort,`/s/${sid}/judge`,{},b.token);if(!r.success||failed)fails++;
      console.log(`${r.success&&!failed?'PASS':'FAIL'} ${id}/${playerId} bestSteps=${r.steps} bestTime=${r.modeledTimeSeconds}s checkpoints=${JSON.stringify(r.checkpoints)}${failed?' '+failed:''}`);
    }
  }} finally {console.log(await stopBroker(b));} process.exit(fails?1:0);
}
if (!pos.length) { console.log('usage: best-path.mjs <probe.json ...> [--out dir]'); process.exit(2); }
const out = resolve(flags.out || join(REPO, 'plans/261027-usability-probe-skill/runs', 'bestpath-' + hhmm()));
const b = await startBroker(out, { max: 1, apiPort: Number(flags['api-port'] || 4391) });
let fails = 0;
onSignal(async () => console.log(await stopBroker(b)));
try {
  for (const f of pos) {
    const probe = loadProbe(resolve(f));
    const persona = loadPersona(probe.personaRefs[0]);
    const runDir = join(out, probe.id);
    const { id } = await call(b.apiPort, '/session', { probe, persona, runDir, runId: `bestpath/${probe.id}`, variant: flags.variant || probe.variant || '' }, b.token);
    let failed = null;
    for (const [i, step] of probe.bestPath.entries()) {
      try { await call(b.apiPort, `/s/${id}/play-step`, step, b.token); }
      catch (e) { failed = `step ${i + 1} ${JSON.stringify(step)}: ${e.message.slice(0, 160)}`; break; }
    }
    const r = await call(b.apiPort, `/s/${id}/judge`, {}, b.token);
    if (!r.success && !failed) failed = `check false after all steps (${r.checkError || probe.success.check})`;
    if (failed) fails++;
    console.log(`${failed ? 'FAIL' : 'PASS'} ${probe.id} steps=${r.steps}${failed ? '\n  ' + failed : ''}`);
  }
} finally { console.log(await stopBroker(b)); }
process.exit(fails ? 1 : 0);
