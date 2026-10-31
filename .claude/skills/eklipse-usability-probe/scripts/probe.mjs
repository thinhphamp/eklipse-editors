// The only tool a player uses. node probe.mjs --session <id> [--broker <port>] <look|click|type|scroll|key|note|done|giveup> [args]
import { parseArgs, call } from './lib/common.mjs';

const { flags, pos } = parseArgs(process.argv.slice(2));
const [action, ...rest] = pos;
const port = Number(flags.broker || process.env.PROBE_BROKER);
const usage = 'usage: probe.mjs --session <id> look | click <ref|"text"|x,y> | drag <ref> <toRef> | type "<text>" [--ref N] | scroll <up|down> [ref] | key <Key> | note "<text>" | done "<why>" | giveup "<why>"';
if (!flags.session || !port || !action) { console.log(usage); process.exit(2); }
const body = { action };
if (action === 'click') { if (rest[0] == null) { console.log(usage); process.exit(2); } body.target = rest.join(' '); }
else if (action === 'drag') { if (!/^\d+$/.test(rest[0] || '') || !/^\d+$/.test(rest[1] || '') || rest.length !== 2) { console.log(usage); process.exit(2); } body.ref = Number(rest[0]); body.toRef = Number(rest[1]); }
else if (action === 'type') { body.text = rest.join(' '); if (flags.ref) body.ref = Number(flags.ref); }
else if (action === 'scroll') { body.dir = rest[0] === 'up' ? 'up' : 'down'; if (rest[1]) body.ref = Number(rest[1]); }
else if (action === 'key') body.key = rest[0];
else if (['note', 'done', 'giveup'].includes(action)) body.text = rest.join(' ');
else if (action !== 'look') { console.log(usage); process.exit(2); }
try { console.log((await call(port, `/s/${flags.session}/act`, body)).text); }
catch (e) { console.log('error: ' + e.message); process.exit(1); }
