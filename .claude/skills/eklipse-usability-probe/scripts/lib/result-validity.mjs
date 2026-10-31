import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Read older Claude output too: quota errors were previously recorded as ordinary failures.
export function invalidReason(result, dir) {
  if (result.offRules?.length) return 'player used commands outside the probe CLI';
  if (result.rateLimited) return 'player quota exhausted';
  if (result.executionError || result.error) return String(result.executionError || result.error);
  if (result.checkError) return 'judge error: ' + result.checkError;
  if (result.timedOut) return 'player process timed out';
  if ('exitCode' in result && result.exitCode !== 0) return 'player exit code ' + result.exitCode;
  // The judge could not read the page at the end (page crashed or reloaded, e.g. dist swapped mid-run).
  if (dir && existsSync(join(dir, 'final-state.json'))) {
    let final;
    try { final = JSON.parse(readFileSync(join(dir, 'final-state.json'), 'utf8')); } catch {}
    if (final && final.state === null) return 'page state unreadable at the end (page crashed or reloaded)';
  }
  if (dir && existsSync(join(dir, 'player-output.json'))) {
    let output;
    try { output = JSON.parse(readFileSync(join(dir, 'player-output.json'), 'utf8')); } catch {}
    if (output?.is_error || output?.api_error) return output.api_error || output.result || 'player API error';
  }
  return null;
}
