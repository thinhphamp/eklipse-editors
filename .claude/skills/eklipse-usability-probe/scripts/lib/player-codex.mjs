// Spawn one `codex exec` player per run. Codex has no per-command allowlist like claude -p, so blindness rests on
// the brief, an empty opaque cwd, no MCP (user config ignored) and an audit: every shell command the player ran is
// read back from the JSON event stream and anything that is not the probe CLI is reported as `offRules`.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, createWriteStream, existsSync, copyFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { livePlayers } from './player-claude.mjs';
import { auditCommands } from './command-audit.mjs';

// Lean player context (phase 10): a CODEX_HOME holding only auth.json, so no skills, AGENTS.md or memories reach the
// player. Copied once from the work home (API-key auth, so the copy never goes stale). Tokdash reads it as `player`.
// HOME points there too: Codex lists every skill in ~/.agents/skills (95 on this Mac, ~5k tokens per request).
export const PLAYER_CODEX_HOME = process.env.PROBE_CODEX_HOME || join(homedir(), '.codex-player');
function playerHome() {
  const auth = join(PLAYER_CODEX_HOME, 'auth.json');
  if (!existsSync(auth)) {
    const src = join(process.env.CODEX_HOME || join(homedir(), '.codex-work'), 'auth.json');
    if (!existsSync(src)) throw new Error(`no ${src} to seed ${PLAYER_CODEX_HOME}; log in to Codex there or set PROBE_CODEX_HOME`);
    mkdirSync(PLAYER_CODEX_HOME, { recursive: true, mode: 0o700 });
    copyFileSync(src, auth); chmodSync(auth, 0o600);
  }
  return PLAYER_CODEX_HOME;
}
const minimalEnv = port => {
  const e = {};
  for (const [k, v] of Object.entries(process.env)) if (/^(PATH|HOME|USER|LANG|LC_ALL|TMPDIR|SHELL|TERM)$/.test(k) || /^(OPENAI_|CODEX_)/.test(k)) e[k] = v;
  const home = playerHome();
  return { ...e, HOME: home, CODEX_HOME: home, PROBE_BROKER: String(port) };
};

// Walk the --json event stream: token usage and every command the agent executed.
function readEvents(text) {
  const commands = [], errors = []; let input = 0, cached = 0, output = 0, turns = 0;
  for (const line of text.split('\n')) {
    let ev; try { ev = JSON.parse(line); } catch { continue; }
    if (ev.type === 'turn.failed' || ev.type === 'error') errors.push(ev.error?.message || ev.message || JSON.stringify(ev));
    const u = ev.usage || ev.info?.total_token_usage;
    if (ev.type === 'turn.completed' && u) { input += u.input_tokens || 0; cached += u.cached_input_tokens || 0; output += u.output_tokens || 0; turns++; errors.length = 0; }
    const item = ev.item || {};
    if (ev.type === 'item.completed' && (item.type === 'command_execution' || item.item_type === 'command_execution')) commands.push(String(item.command || ''));
  }
  return { commands, input, cached, output, turns, errors };
}

// Returns { model, tokens, inputTokens, cachedTokens, outputTokens, costUsd, timedOut, exitCode, offRules }.
export function runCodexPlayer({ model, brief, runDir, shotsDir, cwd, brokerPort, timeoutMs }) {
  mkdirSync(cwd, { recursive: true });
  let env; try { env = minimalEnv(brokerPort); } catch (e) { return Promise.resolve({ model, tokens: 0, costUsd: null, timedOut: false, exitCode: null, error: e.message }); }
  // No --ephemeral: the session file under $CODEX_HOME/sessions is what tokdash reads. Each run is a new session, never resumed.
  // --disable multi_agent: a player never delegates; drops the sub-agent role block from every request.
  // skills.bundled.enabled=false: Codex otherwise lists its built-in system skills (imagegen, skill-creator...) and players
  // opened their folders, which the audit flags as off-rules. Measured: answer "no skills", first-turn input 12562 -> 12102.
  const args = ['exec', '-m', model, '-C', cwd, '--skip-git-repo-check', '--ignore-user-config', '--disable', 'multi_agent', '--json',
    '-c', 'skills.bundled.enabled=false', '-s', 'workspace-write', '-c', 'sandbox_workspace_write.network_access=true', '--add-dir', shotsDir,
    '-o', join(runDir, 'player-last-message.md'), brief];
  const log = createWriteStream(join(runDir, 'player-events.jsonl'));
  return new Promise(resolve => {
    // stdin closed (< /dev/null): codex exec otherwise waits for more input.
    const child = spawn('codex', args, { cwd, detached: false, stdio: ['ignore', 'pipe', 'pipe'], env });
    livePlayers.add(child.pid);
    let out = '', err = '', timedOut = false;
    const finish = r => { livePlayers.delete(child.pid); log.end(); resolve(r); };
    child.on('error', e => { clearTimeout(timer); finish({ model, tokens: 0, costUsd: null, timedOut: false, exitCode: null, error: e.message }); });
    child.stdout.on('data', d => { out += d; log.write(d); }); child.stderr.on('data', d => (err += d));
    writeFileSync(join(runDir, 'player.pid'), String(child.pid));
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); setTimeout(() => child.exitCode === null && child.kill('SIGKILL'), 5000).unref(); }, timeoutMs);
    child.on('close', code => {
      clearTimeout(timer);
      if (err) writeFileSync(join(runDir, 'player-stderr.log'), err.slice(-20000));
      const ev = readEvents(out);
      const executionError = ev.errors.join('; ');
      // Codex retries rate-limit hiccups itself ("Reconnecting... 2/5"); only a run that did not finish counts as a quota stop.
      const rateLimited = (code !== 0 || timedOut) && /rate.?limit|usage.?limit|quota|429|usage cap/i.test(executionError + err);
      const offRules = auditCommands(ev.commands);
      finish({ model, tokens: ev.input + ev.output, inputTokens: ev.input, cachedTokens: ev.cached, outputTokens: ev.output,
        costUsd: null, timedOut, exitCode: code, turns: ev.turns, commands: ev.commands.length, offRules,
        ...(executionError ? { executionError } : {}), ...(rateLimited ? { rateLimited: true, retryMessage: executionError || err.slice(-500) } : {}) });
    });
  });
}
