#!/usr/bin/env node
// Validates personas, targets and probes (schema subset + probe rules). Plain Node, no dependencies.
// Usage: node validate.mjs [probe.json ...]   (no args = every persona and probe in the skill)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = resolve(skill, '../../..');
const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);
const readJson = file => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch (e) { fail(file, `not valid JSON (${e.message})`); return null; } };
const jsonFiles = dir => existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')).map(f => join(dir, f)) : [];

// JSON Schema subset: type, enum, required, properties, additionalProperties:false, items, min/max, pattern.
function check(schema, value, path, file) {
  if (schema.enum && !schema.enum.includes(value)) return fail(file, `${path} must be one of ${schema.enum.join(', ')}`);
  const t = schema.type;
  const actual = Array.isArray(value) ? 'array' : value === null ? 'null' : Number.isInteger(value) && t === 'integer' ? 'integer' : typeof value;
  if (t && !(Array.isArray(t) ? t.includes(actual) : t === actual || (t === 'number' && actual === 'number'))) return fail(file, `${path} must be ${Array.isArray(t) ? t.join(' or ') : t}`);
  if (t === 'string') {
    if (schema.minLength && value.length < schema.minLength) fail(file, `${path} is shorter than ${schema.minLength}`);
    if (schema.maxLength && value.length > schema.maxLength) fail(file, `${path} is longer than ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) fail(file, `${path} does not match ${schema.pattern}`);
  }
  if (t === 'number' || t === 'integer') {
    if (schema.minimum !== undefined && value < schema.minimum) fail(file, `${path} is below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) fail(file, `${path} is above ${schema.maximum}`);
  }
  if (t === 'array') {
    if (schema.minItems && value.length < schema.minItems) fail(file, `${path} needs at least ${schema.minItems} item(s)`);
    if (schema.items) value.forEach((v, i) => check(schema.items, v, `${path}[${i}]`, file));
  }
  if (t === 'object') {
    for (const k of schema.required || []) if (!(k in value)) fail(file, `${path}.${k} is required`);
    for (const [k, v] of Object.entries(value)) {
      if (schema.properties?.[k]) check(schema.properties[k], v, `${path}.${k}`, file);
      else if (schema.additionalProperties === false) fail(file, `${path}.${k} is not a known field`);
    }
  }
}

const probeSchema = readJson(join(skill, 'schemas/probe.schema.json'));
const personaSchema = readJson(join(skill, 'schemas/persona.schema.json'));
const flowSchema = readJson(join(skill, 'schemas/flow.schema.json'));
const playerSchema = readJson(join(skill, 'schemas/player.schema.json'));
const behaviorSchema = readJson(join(skill, 'schemas/behavior.schema.json'));

const personas = new Map();
for (const file of jsonFiles(join(skill, 'personas'))) {
  const p = readJson(file); if (!p) continue;
  check(personaSchema, p, 'persona', file);
  if (p.id !== basename(file, '.json')) fail(file, `id "${p.id}" must equal the file name`);
  personas.set(p.id, p);
}

const targets = new Map();
for (const file of jsonFiles(join(skill, 'targets'))) {
  const t = readJson(file); if (!t) continue;
  const screens = new Set(t.screens?.extra || []);
  const screensFile = t.screens?.file && join(workspace, t.root, t.screens.file);
  if (screensFile && existsSync(screensFile)) readFileSync(screensFile, 'utf8').split(/\s+/).filter(Boolean).forEach(s => screens.add(s));
  targets.set(t.id, { ...t, screenSet: screens });
}

const words = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const containsLabel = (goal, label) => (' ' + words(goal) + ' ').includes(' ' + words(label) + ' ');

function validateProbe(file) {
  const p = readJson(file); if (!p) return;
  check(probeSchema, p, 'probe', file);
  if (p.id && p.id !== basename(file, '.json')) fail(file, `id "${p.id}" must equal the file name`);
  const target = targets.get(p.target);
  if (!target) return fail(file, `unknown target "${p.target}" (targets/: ${[...targets.keys()].join(', ')})`);
  if (p.feature && !target.features.includes(p.feature)) fail(file, `feature "${p.feature}" is not in ${target.id} features: ${target.features.join(', ')}`);
  if (p.start?.screen && !target.screenSet.has(p.start.screen)) fail(file, `start.screen "${p.start.screen}" is not a ${target.id} screen`);
  if (p.scenario && !(target.scenarios || {})[p.scenario]) fail(file, `scenario "${p.scenario}" is not in ${target.id} scenarios: ${Object.keys(target.scenarios || {}).join(', ')}`);
  const knownKeys = new Set(Object.values(target.storageKeys || {}));
  for (const k of Object.keys(p.start?.storage || {})) if (!knownKeys.has(k)) fail(file, `start.storage key "${k}" is not in ${target.id} storageKeys`);
  const refs = (p.personaRefs || []).map(id => personas.get(id) || (fail(file, `unknown persona "${id}"`), null)).filter(Boolean);
  for (const label of target.uiLabels || []) {
    if (!p.goal || !containsLabel(p.goal, label)) continue;
    const allKnow = refs.length && refs.every(r => r.knows.some(k => words(k) === words(label)));
    if (!allKnow) fail(file, `goal names the UI label "${label}"; use the persona's words (or every persona must know it)`);
  }
  if (p.success?.check) {
    try { new Function('state', 'initial', `return (${p.success.check});`); }
    catch (e) { fail(file, `success.check is not a valid JS expression (${e.message})`); }
  }
  for (const [i, s] of (p.bestPath || []).entries()) {
    if (s.do === 'click' && !(s.selector || s.text || (s.role && s.name))) fail(file, `bestPath[${i}] click needs selector, text or role+name`);
    if (s.do === 'type' && typeof s.text !== 'string') fail(file, `bestPath[${i}] type needs text`);
    if (s.do === 'key' && !s.key) fail(file, `bestPath[${i}] key needs key`);
    if (s.do === 'drag' && !(s.selector && s.to)) fail(file, `bestPath[${i}] drag needs selector and to`);
  }
  if (p.budget && p.bestPath && p.budget.steps < p.bestPath.length) fail(file, `budget.steps (${p.budget.steps}) is below the best path (${p.bestPath.length})`);
  if (p.why?.source && !existsSync(join(workspace, p.why.source))) fail(file, `why.source "${p.why.source}" does not exist`);
  return p;
}

const args = process.argv.slice(2);
const probeFiles = args.length ? args.map(a => resolve(a)) : readdirSync(join(skill, 'probes'), { withFileTypes: true })
  .filter(d => d.isDirectory()).flatMap(d => jsonFiles(join(skill, 'probes', d.name)));
const ids = new Map();
for (const file of probeFiles) {
  const p = validateProbe(file);
  if (p?.id) { if (ids.has(p.id)) fail(file, `duplicate probe id (also ${ids.get(p.id)})`); ids.set(p.id, file); }
}


const playerFiles = jsonFiles(join(skill, 'players')); const playerMap = new Map();
for(const file of playerFiles){const player=readJson(file);if(!player)continue;check(playerSchema,player,'player',file);if(player.id!==basename(file,'.json'))fail(file,`id "${player.id}" must equal the file name`);if(!personas.has(player.persona))fail(file,`unknown persona "${player.persona}"`);playerMap.set(player.id,player);}

const behaviors = new Map();
for (const file of jsonFiles(join(skill, 'behaviors'))) {
  const b = readJson(file); if (!b) continue;
  check(behaviorSchema, b, 'behavior', file);
  if (b.id !== basename(file, '.json')) fail(file, `id "${b.id}" must equal the file name`);
  behaviors.set(b.id, b);
}
const flowFiles = jsonFiles(join(skill, 'flows', 'claude-improvement'));
for (const file of flowFiles) {
  const f = readJson(file); if (!f) continue;
  check(flowSchema, f, 'flow', file);
  if (f.id !== basename(file, '.json')) fail(file, `id "${f.id}" must equal the file name`);
  if (!personas.has(f.persona)) fail(file, `unknown persona "${f.persona}"`);
  const target = targets.get(f.target);
  if (!target) fail(file, `unknown target "${f.target}"`);
  else {
    if (f.start?.screen && !target.screenSet.has(f.start.screen)) fail(file, `start.screen "${f.start.screen}" is not a ${f.target} screen`);
    for (const playerId of f.playerIds || []) { const player=playerMap.get(playerId); if(!player)fail(file,`unknown player "${playerId}"`); else { if(player.persona!==f.persona)fail(file,`player ${playerId} persona does not match flow`); if(!behaviors.has(player.behavior))fail(file,`unknown behavior "${player.behavior}"`); if(!(target.scenarios||{})[player.scenario])fail(file,`scenario "${player.scenario}" is not in ${f.target} scenarios`); } }
  }
  for (const cp of f.checkpoints || []) { try { new Function('state', 'initial', `return (${cp.check});`); } catch (e) { fail(file, `checkpoint ${cp.id} has invalid check (${e.message})`); } }
  for (const [i, step] of (f.bestPath || []).entries()) {
    if (step.do === 'click' && !(step.selector || step.text || (step.role && step.name))) fail(file, `bestPath[${i}] click needs selector, text or role+name`);
    if (step.do === 'type' && typeof step.text !== 'string') fail(file, `bestPath[${i}] type needs text`);
    if (step.do === 'key' && !step.key) fail(file, `bestPath[${i}] key needs key`);
    if (step.do === 'drag' && !(step.selector && step.to)) fail(file, `bestPath[${i}] drag needs selector and to`);
  }
}

if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} problem(s)`); process.exit(1); }
console.log(`OK: ${personas.size} personas, ${playerFiles.length} players, ${targets.size} target(s), ${probeFiles.length} probe(s), ${flowFiles.length} flow(s), ${behaviors.size} behavior(s)`);
