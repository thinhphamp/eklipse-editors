// Shared helpers: paths, arg parsing, loading skill files, tiny HTTP client.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

export const SCRIPTS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SKILL = resolve(SCRIPTS, '..');
export const REPO = resolve(SKILL, '../../..');

export const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
export const loadTarget = id => readJson(join(SKILL, 'targets', `${id}.json`));
// A probe with a `scenario` starts from that user state (targets/<id>.json `scenarios`); its own start.storage wins.
export function loadProbe(file) {
  const probe = readJson(file);
  if (!probe.scenario) return probe;
  const sc = (loadTarget(probe.target).scenarios || {})[probe.scenario];
  if (!sc) throw new Error(`${file}: unknown scenario "${probe.scenario}"`);
  return { ...probe, start: { ...probe.start, storage: { ...sc.storage, ...(probe.start.storage || {}) } } };
}
export const loadPersona = id => readJson(join(SKILL, 'personas', `${id}.json`));
export const loadPlayer = id => readJson(join(SKILL, 'players', `${id}.json`));
export function loadFlow(file) {
  const flow = readJson(file);
  return flow;
}
export const loadBehavior = id => readJson(join(SKILL, 'behaviors', `${id}.json`));
export const allPersonas = () => readdirSync(join(SKILL, 'personas')).filter(f => f.endsWith('.json')).map(f => readJson(join(SKILL, 'personas', f)));
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const hhmm = () => new Date().toTimeString().slice(0, 5).replace(':', '');

// --flag value pairs and positionals. Flags in `bool` take no value.
export function parseArgs(argv, bool = []) {
  const flags = {}, pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && a.length > 2) {
      const k = a.slice(2);
      if (bool.includes(k)) flags[k] = true; else flags[k] = argv[++i];
    } else pos.push(a);
  }
  return { flags, pos };
}

// JSON POST/GET to the broker. Throws on non-2xx.
export function call(port, path, body, token, method) {
  return new Promise((resolveP, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const headers = { 'content-type': 'application/json' };
    if (token) headers['x-probe-token'] = token;
    const req = http.request({ host: '127.0.0.1', port, path, method: method || (data ? 'POST' : 'GET'), headers }, res => {
      let buf = '';
      res.on('data', c => (buf += c));
      res.on('end', () => {
        let j; try { j = JSON.parse(buf); } catch { j = { raw: buf }; }
        if (res.statusCode >= 300) reject(new Error(`${path} -> ${res.statusCode} ${j.error || buf}`));
        else resolveP(j);
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

export const brokerFile = out => join(out, 'broker.json');
export const readBroker = out => (existsSync(brokerFile(out)) ? readJson(brokerFile(out)) : null);
