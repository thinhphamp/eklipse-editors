// Start/stop the broker as a child process we own (PID recorded), and talk to it.
import { spawn, execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { mkdirSync, openSync } from 'node:fs';
import { SCRIPTS, readBroker, sleep, call } from './common.mjs';

export async function startBroker(out, { max = 3, apiPort = 4391, staticPort = 0 } = {}) {
  mkdirSync(out, { recursive: true });
  const log = openSync(join(out, 'broker.log'), 'a');
  const child = spawn(process.execPath, [join(SCRIPTS, 'probe-broker.mjs'), '--out', out, '--max', String(max), '--api-port', String(apiPort), '--static-port', String(staticPort)],
    { stdio: ['ignore', log, log] });
  for (let i = 0; i < 100; i++) {
    const b = readBroker(out);
    if (b && b.pid === child.pid) return { child, ...b };
    if (child.exitCode !== null) throw new Error('broker exited early, see ' + join(out, 'broker.log'));
    await sleep(200);
  }
  child.kill('SIGTERM'); throw new Error('broker did not start');
}

const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };

// Graceful shutdown, then SIGTERM/SIGKILL on the recorded PIDs only. Returns a report line.
export async function stopBroker(b) {
  try { await call(b.apiPort, '/shutdown', {}, b.token); } catch {}
  for (let i = 0; i < 40 && alive(b.pid); i++) await sleep(250);
  if (alive(b.pid)) { process.kill(b.pid, 'SIGTERM'); await sleep(1500); }
  if (alive(b.pid)) process.kill(b.pid, 'SIGKILL');
  if (b.browserPid && alive(b.browserPid)) { process.kill(b.browserPid, 'SIGTERM'); await sleep(500); }
  let listening = '';
  try { listening = execFileSync('lsof', ['-nP', `-iTCP:${b.apiPort}`, `-iTCP:${b.staticPort}`, '-sTCP:LISTEN'], { encoding: 'utf8' }); } catch {}
  return `broker pid ${b.pid} ${alive(b.pid) ? 'STILL ALIVE' : 'gone'}; browser pid ${b.browserPid} ${b.browserPid && alive(b.browserPid) ? 'STILL ALIVE' : 'gone'}; ports ${b.apiPort},${b.staticPort} ${listening.trim() ? 'STILL LISTENING' : 'free'}`;
}

// On Ctrl-C / SIGTERM: run `cleanup` (stop live players, then the broker by recorded PID) and exit.
export function onSignal(cleanup) {
  let running = false;
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, async () => {
    if (running) return; running = true;
    console.log(`\n${sig}: cleaning up`);
    try { await cleanup(); } catch (e) { console.log('cleanup error: ' + e.message); }
    process.exit(130);
  });
}
