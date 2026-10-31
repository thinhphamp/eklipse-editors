# Effects, report 1: pain points on v1

Date: 28 Oct 2026. Build: v1, fixed harness. Players: Codex `gpt-6-luna`, 2 runs per player and flow. 28 runs, 12.0M tokens. Runs: `plans/261027-usability-probe-skill/runs/fx-v1-base-2240`. Simulated players, not user research. The demo runs on the Premium plan, so no effect is behind an upgrade dialog.

## Results per flow

| Flow | Who | Success | Steps / best | Reading |
|---|---|---|---|---|
| F1 beep the swear words | quick | 3/4 | 8-11 / 7 | fine |
| F2 cut the quiet gaps | quick | 3/4 | 6-8 / 5 | fine |
| F4 slow motion on the kill | heavy | 3/4 | 10-17 / 6 | long but works |
| F5 speed up a boring stretch | heavy | 2/4 | 12-18 / 6 | long |
| F6 funny voice says "no way" | heavy | 2/4 | 19-30 / 10 | long |
| **F7 make the best moment hit harder** | one-and-done | **1/4** | 8-10 / 5 | pain point 1 |
| **F3 zoom in on the kill, halfway through** | quick | **0/4** | 8 (budget) / 5 | pain point 1 |

## Pain points

### 1. Players add the effect before placing it, and then it can only be moved by dragging (F3, F7)

**Corrected after a browser check:** Zoom is added at the playhead. Players add it first, while the playhead is still at 0:00, and move the playhead afterwards; three F3 runs ended with the playhead at 0:44, 0:17 and 1:00 and the zoom still at 0:00. To move it, players have to drag its chip on the timeline. Quick and one-and-done players run out of steps first: "I added a Zoom effect. I wasn't able to position it on the halfway kill." The one F3 run that got it right had placed the playhead first and then added the effect.

This is the same problem as Elements (pain point: timing only by dragging) and Audio (music start).

**Proposed variant `fx-timing`:** reuse the Elements timing row on effects: "Starts at m:ss · Move to playhead" and "Show for − N s +". Also add new effects at the playhead instead of at 0:00.

### 2. Heavy effects take two to three times the best path (F5, F6)

Speeding up a stretch takes 12-18 steps against 6, and a voice line 19-30 against 10. They work, but they are long. Not targeted this round; the timing row may also shorten F5.

## Next

Build `fx-timing`. A/B it with F3 and F7 as targets; the other Effects flows are the regression set.
