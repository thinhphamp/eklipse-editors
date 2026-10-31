// Spawn one `claude -p` player per run, confined to the probe CLI and its own screenshots.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { SCRIPTS } from './common.mjs';

export const livePlayers = new Set(); // PIDs we spawned; signal handlers stop only these

// Only what claude needs: PATH/HOME, its auth and config vars, plus the broker port.
const minimalEnv = port => {
  const e = {};
  for (const [k, v] of Object.entries(process.env)) if (/^(PATH|HOME|USER|LANG|LC_ALL|TMPDIR|SHELL|TERM)$/.test(k) || /^(ANTHROPIC_|CLAUDE_|AWS_|CLOUD_ML_|GOOGLE_APPLICATION)/.test(k)) e[k] = v;
  return { ...e, PROBE_BROKER: String(port), CLAUDE_CODE_DISABLE_CLAUDE_MDS: '1' };
};

// Returns { model, tokens, costUsd, timedOut, exitCode }.
export function runClaudePlayer({ model, brief, runDir, shotsDir, cwd, brokerPort, timeoutMs }) {
  const args = ['-p', '--model', model, '--permission-mode', 'dontAsk', '--tools', 'Bash,Read',
    '--allowedTools', `Bash(node ${join(SCRIPTS, 'probe.mjs')}:*)`, `Read(/${shotsDir}/**)`,
    '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--setting-sources', '', '--disable-slash-commands',
    '--no-session-persistence', '--output-format', 'json'];
  // cwd is an empty folder outside the run dir (opaque name): the default 'cwd is readable' rule must not expose actions.jsonl or result.json.
  mkdirSync(cwd, { recursive: true });
  return new Promise(resolve => {
    const child = spawn('claude', args, { cwd, detached: false, stdio: ['pipe', 'pipe', 'pipe'],
      env: minimalEnv(brokerPort) });
    livePlayers.add(child.pid);
    const finish = r => { livePlayers.delete(child.pid); resolve(r); };
    child.on('error', e => { clearTimeout(timer); finish({ model, tokens: 0, costUsd: null, timedOut: false, exitCode: null, error: e.message }); });
    let out = '', err = '', timedOut = false;
    child.stdout.on('data', d => (out += d)); child.stderr.on('data', d => (err += d));
    writeFileSync(join(runDir, 'player.pid'), String(child.pid));
    // This PID only: SIGTERM, then SIGKILL after 5 s if it is still there.
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); setTimeout(() => child.exitCode === null && child.kill('SIGKILL'), 5000).unref(); }, timeoutMs);
    child.on('close', code => {
      clearTimeout(timer);
      writeFileSync(join(runDir, 'player-output.json'), out || err);
      let j = {}; try { j = JSON.parse(out); } catch {}
      const u = j.usage || {};
      const tokens = (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
      finish({ model, tokens, costUsd: j.total_cost_usd ?? null, timedOut, exitCode: code, turns: j.num_turns ?? null,
        ...(j.is_error || j.api_error ? { executionError: j.api_error || j.result || 'Claude API error' } : {}),
        ...(j.api_error_status === 429 || j.api_error === 'usage_limit_reached' ? { rateLimited: true, retryMessage: j.result } : {}) });
    });
    child.stdin.end(brief);
  });
}
