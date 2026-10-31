# Probe format

A probe is one JSON file in `probes/<target>/<id>.json`. Machine schema: `schemas/probe.schema.json`;
`scripts/validate.mjs` checks the schema plus the rules below. Record name in Eklipse Quality: Scenario (discovery mode).

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | kebab-case, unique, equals the file name (`layouts-find-by-look`) |
| `feature` | yes | One of the target's `features` (Layouts, Elements, Captions, Timeline, AI Edit review, My styles, Audio, Effects, Export, Brand sticker) |
| `personaRefs` | yes | Persona ids that play it (`personas/<id>.json`), at least one |
| `target` | yes | Target id (`claude-improvement`); `prod-web` / `qc-web` in phase 8 |
| `start` | yes | `{ "screen": "L00", "storage": { "<key>": <value> } }`. `screen` is a target screen id (or `default`). `storage` seeds localStorage after the persona's own fixtures (probe wins) |
| `goal` | yes | What the persona wants, in their words, 1-2 sentences. Never a UI label (see below) |
| `success` | yes | `{ "check": "<JS expression>", "describe": "<plain words>" }`. `check` sees `state` (now) and `initial` (state at start) and must be true only when the goal is met |
| `budget` | yes | `{ "steps": 8, "scrolls": 4, "minutes": 4 }`. The runner stops at 2 × steps |
| `bestPath` | yes | Scripted shortest path, list of steps (below). Used for the step ratio and to prove `check` is reachable |
| `why` | yes | `{ "data": "<number and meaning>", "source": "<repo path>" }` |
| `holdout` | yes | `true` = the variant designer never sees this probe |
| `firstClickAlso` | no | Accessible-name patterns (regex, case-insensitive) of other first clicks that are equally right, e.g. `["^Brand"]` when the Brand chip and the Elements rail both lead to the goal. Without it, only the first `bestPath` click counts as a right first click |
| `scenario` | no | User state from the target's `scenarios` (`fresh-user`, `exported-no-style`, `style-matches-last`, `style-differs-from-last`, `demo`). Its storage is seeded before `start.storage`. Use it when the result depends on the user's history |
| `variant` | no | Variant id the probe pins (`?variant=`); normally set by the A/B runner, not by hand |
| `notes` | no | For humans; never shown to the player |

## The goal rule

The player must find the control, so the goal cannot name it. `validate.mjs` fails a goal that contains any of the
target's `uiLabels` (case-insensitive, whole words), unless every persona in `personaRefs` lists that label in `knows`.
Write "keep the game HUD visible", not "Game UI"; "put my channel name on the clip", not "Social Stickers".

## bestPath steps

Only the judge side reads these, so selectors are allowed.

```json
{ "do": "click", "role": "button", "name": "Layouts" }
{ "do": "click", "selector": ".layout-grid button[aria-label='Game UI']" }
{ "do": "click", "text": "Add text" }
{ "do": "type", "selector": "input[type=search]", "text": "bruh" }
{ "do": "key", "key": "Enter" }
{ "do": "scroll", "selector": ".panel-scroll", "dy": 600 }
```

Each step counts as one player step. A scroll counts as a step and as a scroll screen.

## Success check examples (prototype)

```js
state.layoutId === 'Game UI'
state.elements.some(e => e.category === 'Text Elements') && state.layoutId === initial.layoutId
state.elements.filter(e => e.ai).length === initial.elements.filter(e => e.ai).length - 1
```

Keep checks about the outcome, not the path: any route the user finds that reaches the goal counts.
