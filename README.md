# Eklipse editor prototype and usability probe harness

A clickable prototype of the Eklipse web clip editor, plus the harness that tests it with simulated players. The
players are LLM agents with persona cards. They play the prototype blind, and a script judges success from the editor
state. Treat the results as a first filter for where real users may stall. They are not user research.

| Folder | What it is |
|---|---|
| `prototypes-src/claude-improvement/` | The prototype (Vite, React, TypeScript). Demo media and fixtures only, no backend. |
| `.claude/skills/eklipse-usability-probe/` | The probe harness: flows, personas, players, variant plans, broker, judge and A/B scripts. `SKILL.md` is the guide. |
| `design-drafts/` | Design sandbox, one folder per feature with a brief, variants and decisions. Only a confirmed variant moves into the prototype. |
| `docs/`, `plans/` | The evidence files that flows cite in `why.source` (personas, adoption research, earlier round reports). |

Keep this layout. The harness looks for the prototype at `prototypes-src/claude-improvement`, relative to the repo root.

## Versions

| Tag | What |
|---|---|
| `proto-claude-improvement-v3` | Current default. The CTO build from 30 Oct (evening) adds the preview strip for safe zone and zoom (`pv-strip`), restyles the Audio library, cuts the Effects menu to Zoom, Speed and Censor, removes My styles from the top bar and gives the channel sticker its own timeline lane. |
| v2 (not tagged here) | The CTO review build from 30 Oct: Templates grid, background caption job with a preset editor, Channel stickers tab and Elements category tabs. Tested in round 3. |

## Prototype

```
cd prototypes-src/claude-improvement
npm install && npm run build   # dist/
npm run serve                  # /prototype.html
npm run check                  # type check + colour token check
```

The default page runs the promoted variant set (`promoted` in `src/variant.ts`). `?variant=a,b` adds variants on top of
that set. `?variant=baseline,...` switches to the pre-CTO panels and adds only the ids listed after it.

To start from app.eklipse.gg (clip and template picked in the web app, a waiting screen, then the template arrives),
open `prototype.html?start=app` for the scenario picker. See `design-drafts/261030-start-from-app/`.

## Harness

Build the prototype first. The broker serves its `dist/` and uses its Playwright. Run these from
`.claude/skills/eklipse-usability-probe/scripts`:

```
node validate.mjs                                   # format and rule check, prints OK
node best-path.mjs --flows q6-save-and-reuse-look   # play a flow's scripted best path, no LLM
node run-probes.mjs --flows <ids> --preflight --out <dir>           # one blind run per flow
node ab-sequential.mjs --variant <id> --baseline <dir> --out <dir> --confirmed-preflight <dir>
```

Players run through the Codex CLI (`codex exec`, model `gpt-6-luna` by default). The harness seeds a lean player home
from `$CODEX_HOME/auth.json` (default `~/.codex-work`). Set `PROBE_CODEX_HOME` to change it. Run output goes to
`plans/261027-usability-probe-skill/runs/`, which git ignores. Script options are in `scripts/README.md`.

On v3, every flow's best path passes except `aud-game-quieter` and `aud-mute-game-part`. Both need `--variant
aud-game-sound`, the same as on v1 and v2. Retired flows and variants live in the `*-retired` folders, and each README
there says why.

`SKILL.md` writes some paths as `~/dev/eklipse/...`. Read them as relative to this repo's root.

## Product rules kept here

- Captions: one speaker per clip. Users pick a preset, can tune it in the preset editor (font, stroke, fill,
  highlight), and edit the text line by line. There are no speaker features.
- Templates apply to the whole clip (layout, 9:16, caption preset, sticker). Per-part layouts are gone.
- Channel stickers have their own rail tab. A clip can hold up to 3, and the look is remembered for the next clip.
- Production is read-only for probes: they stop before save or export on real accounts.
