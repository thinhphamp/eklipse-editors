# Metrics and grading

## Logged per run (`result.json`)

| Metric | How |
|---|---|
| `success` | Judge evaluates `success.check` once the player stops (done, give-up or budget) |
| `steps` | Player actions that change or inspect the page (`click`, `type`, `scroll`, `key`); `look` and `note` are free |
| `scrolls` | Scroll actions (each one screen) |
| `backtracks` | Back/close/undo actions, or returning to a tab already visited without a change in between |
| `wrongFirstClick` | First click does not match the first click of `bestPath` (same tab/control) |
| `timeSec` | Wall time from first to last action (secondary on production: editor load inflates it) |
| `gaveUp` | Player called `giveup` |
| `budgetHit` | Runner stopped at 2 × `budget.steps` |
| `notes` | Think-aloud lines from `note`, kept verbatim as quotes |
| `stepRatio` | `steps / bestPath.length` |
| `tokens`, `model` | Player cost, for the bake-off |

Actions stream to `actions.jsonl` as Observation records ([records](records.md)); screenshots sit next to them.

## Grading (draft, tune in phase 6)

Per feature × persona, over all runs of that feature's probes:

| Grade | Rule |
|---|---|
| **Good enough** | ≥ 80% success, median step ratio ≤ 1.5, no give-up |
| **Friction** | 50-80% success, or median step ratio > 1.5, or ≥ 30% wrong first clicks |
| **Blocked** | < 50% success, or the persona gives up in most runs |

A feature's overall grade is the worst grade among the top 4 personas. Held-out probes count in the scorecard like
any other probe.

## Every report carries

- "An LLM player is a filter, not a user test. Simulated hesitation is not user sentiment."
- Runs per cell (n) and the player model.
- Which libraries in the target are production-sized (phase 3 fidelity note); findability on a small list proves little.
