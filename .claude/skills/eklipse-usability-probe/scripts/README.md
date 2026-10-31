# Probe harness (phase 2)

Plain Node ESM, no new dependencies. Playwright comes from `prototypes-src/claude-improvement/node_modules`.

| Script | Role |
|---|---|
| `probe-broker.mjs` | Only process that owns a browser. Serves the target `dist/`, one headless Chromium, one context per session, queue (`--max`, hard cap 4) plus `resource-guard.sh` admission. Writes `<out>/broker.json` (pid, ports, token). |
| `probe.mjs` | Player CLI: `--session <id> look|click|type|scroll|key|note|done|giveup`. Port from `PROBE_BROKER` or `--broker`. |
| `run-probes.mjs` | Runner: probes x personas x runs, brief, player, judge, summary table, broker shutdown check. |
| `judge.mjs` | Success check on `__verify.state` + metrics from `actions.jsonl` (module used by the broker). |
| `best-path.mjs` | Plays each probe's `bestPath` with no LLM: `PASS|FAIL <probe> steps=N`. Use it to verify probes. |
| `journey-score.mjs` | Aggregates flow runs per model, player, flow, persona and weighted overall score. |
| `ab-sequential.mjs` | Sequential A/B for one variant (`variants/claude-improvement/<id>.json`): stage 1, early stop, stage 2, keep rule. `--replay` re-decides an old sweep offline. |
| `preflight-report.mjs` | Reprints the preflight table of a `--preflight` run dir and rewrites its `preflight.json`. |
| `lib/*.mjs` | common, look (player view; lists only the topmost open modal dialog if any, and skips fully covered elements), session, brief, player-claude, broker-client. |

```
node best-path.mjs ../probes/claude-improvement/*.json
node run-probes.mjs --probes '../probes/claude-improvement/*.json' --personas top4 --runs 3 --max 4 --player claude:sonnet --out <dir>
node run-probes.mjs --probes <file> --personas first-clip-newcomer --runs 1 --player manual --out <dir>   # prints RUN <dir> SESSION <id>
node run-probes.mjs --flows q1-same-as-last,o2-horizontal --preflight --player codex:gpt-6-luna --variant baseline --out <pf-dir>
node run-probes.mjs --flows q1-same-as-last,o2-horizontal --runs 3 --player codex:gpt-6-luna --variant baseline --confirmed-preflight <pf-dir> --token-budget 20000000 --out <dir>
node best-path.mjs --flows q1-same-as-last,o2-horizontal --variant baseline
node journey-score.mjs <run-dir>
node ab-compare.mjs --journey --dir <variant-run> --baseline <baseline-run>
node ab-sequential.mjs --variant look-save --baseline <baseline-run> --out <variant-run> --confirmed-preflight <pf-dir> [--token-budget N]
node ab-sequential.mjs --variant look-save --baseline <baseline-run> --out <old-variant-run> --replay
```

## Token cost guards (phase 10)
- **Preflight gate.** A flow sweep refuses to start without `--confirmed-preflight <dir>`. `--preflight` runs one run per flow (its first player, first model), prints flow, pass, steps, last checkpoint, invalid reason, tokens and the player's last line, and writes `<dir>/preflight.json`. The gate checks that the preflight covers every requested flow and warns when its variant differs.
- **Run plan and budget.** Each flow invocation writes `<out>/run-plan.json` (runs, players, variant, preflight dir, token estimate from preflight tokens per flow, budget) and appends one line per finished run to `<out>/sweep-log.jsonl`. `--token-budget <tokens>` stops new runs once this invocation has spent that many tokens (running ones finish) and exits 76. Use 1-3 runs for triage (preflight, A/B stage 1) and 3-5 for decisions.
- **Sequential A/B.** Stage 1: 3 runs per target pair, 1 per regression pair, on both baseline and variant (`--resume`, so existing valid cells are reused). Clear drop: target success down 2+ runs and mean target score down 10+. There is no early keep (on night-0011 a stage-1 clear win was a full-sweep drop). Otherwise stage 2 tops target pairs up to 5 runs and the unchanged journey keep rule decides. Untouched flows are skipped. The rule that fired is in `<out>/sequential-ab.json`. A missing cell gives `incomplete`; rerun the same command to resume. Exit 2 = incomplete or stopped (quota, budget).

Output per run: `<out>/<probe>/<persona>/<n>/{brief.md, actions.jsonl, shots/NNN.jpg, final.jpg, result.json, player-output.json}`.

## Player confinement (claude players)
`claude -p --permission-mode dontAsk --tools Bash,Read --allowedTools "Bash(node <probe.mjs>:*)" "Read(/<runDir>/shots/**)" --strict-mcp-config --mcp-config '{}' --setting-sources "" --disable-slash-commands --no-session-persistence`, brief on stdin, env `CLAUDE_CODE_DISABLE_CLAUDE_MDS=1`.
- `dontAsk` denies everything not allowed (verified). Absolute Read patterns need a leading extra slash (`//abs/path`).
- cwd is `<runDir>/player/` (empty): the default "cwd is readable" rule would otherwise expose `actions.jsonl`.
- Timeout 2 x `budget.minutes`: only that player PID gets SIGTERM.

## Notes
- Broker PIDs (broker + its Chromium child) are recorded; `stopBroker` kills only those and checks ports.
- Seeds: persona `fixtures.storage` then probe `start.storage`, via init script (once per tab).
- The player's click-by-text also matches aria-label/title of buttons.

## Persona flows and journey scoring

Flows in `flows/claude-improvement/` define one continuous mission with ordered final-state checkpoints and a scripted best path. `playerIds` reference shared definitions in `players/<id>.json`; every player whose persona matches the flow plays it. Flow `input` owns the clip fixture and optional mission extra. `--flows` runs each row for each requested `--player` model and writes `<run>/<player-model>/<flow-id>/<player-id>/<n>/result.json`. The brief contains the persona card, behavior brief and mission; it does not reveal checkpoints or editor tool names. Patience sets the action budget to `ceil(bestPath.length × patience)`, with a minimum of four actions; players whose persona is `one-and-done` get at least eight. The rule is recorded as `budget.steps` and `budget.budgetRule` in `result.json` and per job in `run-plan.json`.

Journey results include final checkpoint booleans, the last passed checkpoint, modeled action time and wall time. `journey-score.mjs` keeps model scorecards separate, reports per-player and per-flow metrics, splits each flow weight evenly over that flow’s player pairs, then applies persona weights (quick-user 0.45, one-and-done 0.30, heavy-editor 0.25). A failed checkpoint makes the journey score zero. `ab-compare.mjs --journey` requires matched model, flow, player and repeat cells; the primary model gets the keep verdict and a second model is reported as a check.

## Codex players (`--player codex:gpt-6-luna`)
`codex exec -m <model> -C <opaque cwd> --skip-git-repo-check --ignore-user-config --json -s workspace-write -c sandbox_workspace_write.network_access=true --add-dir <shots>` (no `--ephemeral`, so tokdash sees player sessions), stdin closed.
Lean context (phase 10): the cwd is an empty `$TMPDIR/probe-player/<random>` outside the repo (removed after the run), so no repo `AGENTS.md` is loaded. `CODEX_HOME` is `~/.codex-player` (override: `PROBE_CODEX_HOME`), holding only `auth.json` copied once from `~/.codex-work`, so no skills or memories are listed; `-c skills.bundled.enabled=false` also hides Codex's built-in system skills (imagegen, skill-creator, ...), which players otherwise tried to open. Tokdash shows these sessions under the account `player`.
Codex has no per-command allowlist, so blindness rests on the brief, the empty cwd, no MCP, and an audit: every shell command from the JSON events lands in `result.json` as `commands`, and anything that is not a plain probe CLI call goes to `offRules`. A run with a non-empty `offRules` must not be scored. Token usage comes from `turn.completed` events; Codex reports no cost.


## Interrupted sweeps and valid results

Use `--resume` with the original player output directory. Valid cells are kept; invalid or unfinished attempts move to `.attempts/<probe>/<persona>/<repeat>-<timestamp>/` before replay. The runner exits nonzero for execution/audit failures and exits 75 on quota exhaustion, after allowing already-started cells to finish. Stop the outer sweep on that exit; inspect the saved error and wait for the stated reset rather than repeatedly calling the model.

`lib/result-validity.mjs` is shared by the runner, scorer and comparator. API/process errors, timeouts, judge errors and commands outside the probe CLI are excluded from usability rates. The command audit accepts a verified symlink to the same CLI and rejects other programs, redirects, expansions and command composition. A failed attempt through a nonexistent path stays excluded. The brief tells players to copy the full prefix exactly.

`ab-compare.mjs` defaults to three repeats and both `claude-sonnet,codex-gpt-6-luna`. It deduplicates baseline cells and matches persona/repeat/scenario pairs. Missing required pairs produce `incomplete`, never keep/drop. `--runs` and `--players` can change the declared comparison scope; identify any single-player comparison as such in the report. Decisions use unrounded rates and step improvements.

Regression checks: `node --test tests/result-validity.test.mjs`. The deterministic scroll regression (`node tests/scroll-snapshot.mjs <evidence-dir>`) needs the normal broker port free and checks three times that the returned GG reference hits GG after the smooth-scroll category jump.

After a command-audit fix, `node reaudit.mjs <run-dir>` recalculates only Codex command flags from saved event logs. It preserves original flags and leaves goal success and metrics unchanged. Quoted notes and verified aliases are accepted; do not clear flags manually to fill a sample.


`type --ref` focuses a field only if needed and preserves a current selection. The real-browser regression `node tests/selection-typing.mjs <evidence-dir>` checks Meta/Control/Ctrl+A followed by typing through the same reference. `audit-selection.mjs <run-dir>... --out <file>` locates old player trials at risk; add `--mark` to preserve their originals and exclude them for replay. Old Claude logs lack CLI arguments, so select-all/type pairs are conservatively flagged. Fixed typed actions record `ref` and `keptFocus` and are skipped by this audit.

`node tests/fullscreen-view.mjs <evidence-dir>` checks that fullscreen lists only the painted preview subtree and Escape restores the editor. The key adapter explicitly exits native fullscreen because synthetic key events alone do not invoke that Chromium behavior.

Loop 1 winners are default-on; future baseline sweeps must pass `--variant baseline`.
