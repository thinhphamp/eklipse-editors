// Uses a Playwright Chromium already in the local cache (no download).
import { readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function browserPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  const dirs = readdirSync(cache).filter(d => d.startsWith('chromium-')).sort().reverse();
  for (const d of dirs) {
    const p = join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
    const legacy = join(cache, d, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium');
    if (existsSync(p)) return p;
    if (existsSync(legacy)) return legacy;
  }
  throw new Error('No cached Chromium found; set CHROMIUM_PATH');
}
