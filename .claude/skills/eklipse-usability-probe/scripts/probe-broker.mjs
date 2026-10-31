// The ONE process that owns the browser. Serves the target's dist, opens one Chromium, one context per session.
// Usage: node probe-broker.mjs --out <dir> [--api-port 4391] [--static-port 0] [--max 3] [--target claude-improvement]
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { execFile, execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { REPO, SCRIPTS, parseArgs, loadTarget, sleep, brokerFile } from './lib/common.mjs';
import { Session } from './lib/session.mjs';

const { flags } = parseArgs(process.argv.slice(2));
const out = resolve(flags.out || '.');
const MAX = Math.min(4, Number(flags.max || 3));
const target = loadTarget(flags.target || 'claude-improvement');
const protoRoot = join(REPO, target.root);
const { chromium } = createRequire(import.meta.url)(join(protoRoot, 'node_modules/playwright-core'));
const { serveDist } = await import(join(protoRoot, 'scripts/serve-dist.mjs'));
const { browserPath } = await import(join(protoRoot, 'scripts/browser-path.mjs'));
const token = randomBytes(16).toString('hex');
const POLL = Number(process.env.PROBE_GUARD_POLL_MS || 10000);
mkdirSync(out, { recursive: true });

const staticServer = await serveDist(join(protoRoot, target.dist), Number(flags['static-port'] || 0));
const staticPort = staticServer.address().port;
const browser = await chromium.launch({ executablePath: browserPath(), headless: true });
const sessions = new Map();
let active = 0, admit = Promise.resolve(), nextId = 1;

const hold = () => new Promise(r => execFile(join(SCRIPTS, 'resource-guard.sh'), (err, so) => { if (err) console.log('guard:', so.trim()); r(!!err); }));
const admission = () => (admit = admit.then(async () => {
  while (active >= MAX) await sleep(200);
  while (await hold()) await sleep(POLL);
  active++;
}));

const seedScript = entries => { if (sessionStorage.getItem('__probe_seeded')) return; sessionStorage.setItem('__probe_seeded', '1');
  for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v); };

async function openSession({ probe, persona, runDir, runId, variant, clip, shotsDir }) {
  await admission();
  const id = 's' + nextId++ + '-' + randomBytes(3).toString('hex');
  let ctx;
  try {
    const vp = target.viewport || { width: 1280, height: 800 };
    ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: Math.min(1, 960 / vp.width) });
    const entries = {};
    for (const src of [persona.fixtures && persona.fixtures.storage, probe.start && probe.start.storage])
      for (const [k, v] of Object.entries(src || {})) entries[k] = typeof v === 'string' ? v : JSON.stringify(v);
    await ctx.addInitScript(seedScript, entries);
    // Nothing leaves the box: only loopback (and inline data/blob) requests are allowed.
    await ctx.route('**/*', r => { const u = r.request().url(); (/^(data|blob|about):/.test(u) || new URL(u).hostname === '127.0.0.1') ? r.continue() : r.abort(); });
    const page = await ctx.newPage();
    const q = [];
    if (probe.start.screen && probe.start.screen !== 'default') q.push('screen=' + encodeURIComponent(probe.start.screen));
    q.push(target.verifyParam || 'verify');
    if (variant) q.push('variant=' + encodeURIComponent(variant));
    if (clip) q.push('clip=' + encodeURIComponent(clip));
    await page.goto(`http://127.0.0.1:${staticPort}/${target.page}?${q.join('&')}`, { waitUntil: 'load' });
    await page.waitForSelector('.topbar, [aria-label="Eklipse editor prototype"]', { timeout: 20000 });
    await page.waitForFunction(() => window.__verify && window.__verify.state, null, { timeout: 10000 });
    await sleep(400);
    const initial = await page.evaluate(() => JSON.parse(JSON.stringify(window.__verify.state)));
    const s = new Session({ id, ctx, page, probe, persona, runDir, runId, initial, shotsDir });
    sessions.set(id, s);
    return { id };
  } catch (e) { active--; if (ctx) await ctx.close().catch(() => {}); throw e; }
}

// Idempotent: closes the context and gives the admission slot back (judge, abort, shutdown all use it).
async function release(s) {
  await s.close();
  if (sessions.delete(s.id)) active--;
}

const readBody = req => new Promise(r => { let b = ''; req.on('data', c => (b += c)); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } }); });
const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };

const api = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://x').pathname;
    const body = req.method === 'POST' ? await readBody(req) : {};
    const m = /^\/s\/([^/]+)\/(act|judge|play-step|abort)$/.exec(path);
    const priv = path === '/session' || path === '/shutdown' || (m && m[2] !== 'act') || /^\/s\/[^/]+\/abort$/.test(path);
    if (priv && req.headers['x-probe-token'] !== token) return send(res, 403, { error: 'token required' });
    if (path === '/health') return send(res, 200, { ok: true, active, sessions: sessions.size, max: MAX });
    if (path === '/session') return send(res, 200, await openSession(body));
    if (path === '/shutdown') { send(res, 200, { ok: true }); setTimeout(shutdown, 50); return; }
    if (!m) return send(res, 404, { error: 'not found' });
    const s = sessions.get(m[1]);
    if (!s) return send(res, 404, { error: 'no such session' });
    if (m[2] === 'act') {
      if (body.action === 'drag' && (!Number.isInteger(body.ref) || !Number.isInteger(body.toRef))) return send(res, 400, { error: 'drag requires integer ref and toRef' });
      return send(res, 200, { text: await s.act(body) });
    }
    if (m[2] === 'play-step') { await s.playStep(body); return send(res, 200, { ok: true }); }
    if (m[2] === 'abort') { await release(s); return send(res, 200, { ok: true }); }
    try { return send(res, 200, await s.judge(body.meta || {})); } finally { await release(s); }
  } catch (e) { send(res, 500, { error: String(e.message || e).split('\n')[0] }); }
});

async function shutdown() {
  for (const s of [...sessions.values()]) await release(s);
  await browser.close().catch(() => {});
  staticServer.close(); api.close();
  process.exit(0);
}
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);

await new Promise(r => api.listen(Number(flags['api-port'] || 4391), '127.0.0.1', r));
// Chromium is a direct child of this process; record its PID so the runner can verify it is gone.
let browserPid = null;
try { browserPid = Number(execFileSync('pgrep', ['-P', String(process.pid)], { encoding: 'utf8' }).split('\n')[0]) || null; } catch {}
writeFileSync(brokerFile(out), JSON.stringify({ pid: process.pid, apiPort: api.address().port, staticPort, token, browserPid }));
console.log(`broker pid ${process.pid} api ${api.address().port} static ${staticPort}`);
