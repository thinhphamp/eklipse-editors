#!/usr/bin/env node
// Reprint the preflight table of a `run-probes --flows ... --preflight` dir and rewrite its preflight.json.
// Usage: node preflight-report.mjs <preflight-dir>
import { existsSync } from 'node:fs';
import { writePreflight } from './lib/sweep-plan.mjs';

if (!process.argv[2] || !existsSync(process.argv[2])) { console.error('usage: node preflight-report.mjs <preflight-dir>'); process.exit(2); }
writePreflight(process.argv[2]);
