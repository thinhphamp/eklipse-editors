#!/usr/bin/env node
// Re-evaluate saved Codex command logs after an audit fix; no model replay or success change.
import { globSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { auditCommands } from './lib/command-audit.mjs';
const root = resolve(process.argv[2] || '');
if (!process.argv[2] || !existsSync(root)) throw new Error('usage: node reaudit.mjs <run-dir>');
let checked = 0, changed = 0;
for (const file of globSync(join(root, '**/result.json'))) {
  if (file.includes('/.attempts/') || file.includes('/.p/')) continue;
  const r = JSON.parse(readFileSync(file));
  const events = join(dirname(file), 'player-events.jsonl');
  if (!r.player?.startsWith('codex:') || !existsSync(events)) continue;
  const commands = readFileSync(events, 'utf8').split('\n').filter(Boolean).flatMap(line => {
    const e = JSON.parse(line);
    return e.type === 'item.completed' && (e.item?.type === 'command_execution' || e.item?.item_type === 'command_execution') ? [e.item.command] : [];
  });
  const offRules = auditCommands(commands); checked++;
  if (JSON.stringify(offRules) === JSON.stringify(r.offRules || [])) continue;
  r.offRulesOriginal ??= r.offRules || []; r.offRules = offRules; r.commandAuditVersion = 3;
  writeFileSync(file, JSON.stringify(r, null, 2) + '\n'); changed++;
}
console.log(`reaudited ${checked} runs, ${changed} changed; original flags retained`);
