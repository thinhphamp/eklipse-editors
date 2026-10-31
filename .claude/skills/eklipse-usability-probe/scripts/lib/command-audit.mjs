import { realpathSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SCRIPTS } from './common.mjs';

// Parse a single plain invocation without evaluating shell text. Quoted prose is allowed;
// expansions, redirects and command composition are rejected.
function words(text) {
  const tokens = []; let word = '', quote = '', started = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '\\' && quote !== "'") {
      const next = text[i + 1];
      if (next === undefined) return null;
      if (quote !== '"' || /["$`\\\n]/.test(next)) { if (next !== '\n') word += next; i++; }
      else word += char;
      started = true; continue;
    }
    if (quote) {
      if (char === quote) quote = '';
      else { if (quote === '"' && /[$`]/.test(char)) return null; word += char; }
    } else if (char === '"' || char === "'") { quote = char; started = true; }
    else if (/[;&|<>`$()\r\n]/.test(char)) return null;
    else if (/\s/.test(char)) { if (started) { tokens.push(word); word = ''; started = false; } }
    else { word += char; started = true; }
  }
  if (quote) return null;
  if (started) tokens.push(word);
  return tokens;
}

export function parseInvocation(command) {
  let tokens = words(command);
  if (tokens && /^\/bin\/(?:ba|z)sh$/.test(tokens[0]) && tokens[1] === '-lc') tokens = tokens.length === 3 ? words(tokens[2]) : null;
  return tokens;
}

export function auditCommands(commands) {
  const canonical = realpathSync(join(SCRIPTS, 'probe.mjs'));
  const actions = new Set(['look', 'click', 'drag', 'type', 'scroll', 'key', 'note', 'done', 'giveup']);
  return commands.filter(command => {
    const tokens = parseInvocation(command);
    // `node <missing file> ...` fails before running any code (players sometimes mistype the CLI path): harmless.
    if (tokens && tokens[0] === 'node' && tokens[1] && !tokens[1].startsWith('-') && !existsSync(tokens[1])) return false;
    if (!tokens || tokens[2] !== '--session' || !tokens[3] || !actions.has(tokens[4])) return true;
    try {
      return (tokens[0] !== 'node' && realpathSync(tokens[0]) !== realpathSync(process.execPath)) || realpathSync(tokens[1]) !== canonical;
    } catch { return true; }
  });
}
