# Captions, report 1: pain points on v1

> **Correction (28 Oct, later the same day).** The first baseline below ran on a harness that listed buttons hidden behind an open dialog. Players clicked the bottom-bar "Export clip" behind the export dialog, so many runs "failed at export". After the fix, a rerun on the same build (`runs/cap-v1-base2-1619`, 28 runs, 10.4M tokens) gave C1 4/4 (8-10 steps against 7), C3 4/4 but 15-25 steps against 9, C4 4/4 (13-16 against 10), C5 2/4, and Q3, Q6, C2 4/4. **What still holds:** pain point 2, the buried highlight colour, now as a step cost rather than failures. **What does not hold:** pain point 1, word editing, which is now only 1-3 extra steps, and pain point 3, export, which was a harness artifact. The first A/B verdicts for both Captions variants are void. `cap-highlight-color` is re-tested on the clean baseline.

Date: 28 Oct 2026. Build: v1. Players: Codex `gpt-6-luna`, 6 players, 2 runs per player and flow. 28 runs, 14.7M tokens. Runs: `plans/261027-usability-probe-skill/runs/cap-v1-base-1512`.

Harness: this is the first round with the click-target fix, the one-and-done floor of 8 steps, and the bundled Codex skills off. All 28 runs were valid. Simulated players, not user research.

## Results per flow

| Flow | Who | Success | Steps / best | Reading |
|---|---|---|---|---|
| Q6 save and reuse a look | quick | 4/4 | 10 / 10 | fine |
| Q3 add captions | quick | 4/4 | 8 / 5 | passes, but every run spends its spare steps after export |
| C2 captions in another look | quick | 4/4 | 9 / 6 | same: passes on the last step |
| C4 rename a speaker | heavy | 3/4 | 16-30 / 10 | the rename takes about 9 steps; the rest is export |
| C3 highlight the spoken word in pink | heavy | 2/4 | 19-27 / 9 | pain point 2 |
| C5 big bold words | one-and-done | 2/4 | 9-12 / 6 | the novice set the style, then ran out at export |
| **C1 fix one misheard word** | quick | **0/4** | 11 / 7 | pain point 1 |

## Pain points

### 1. Editing a word adds to it instead of replacing it (C1)

Clicking a word opens a text field with the cursor at the end, so typing "Uh," gives "Ah,Uh,". Every run needed three tries (type, click the field, select all, type again) and then ran out of steps before export. The fix itself worked in all 4 runs.

**Proposed variant `cap-word-replace`:** when the word field opens, its text is selected, so typing replaces it. Enter saves and closes.

### 2. The highlight colour is buried (C3)

The colour of the spoken-word highlight sits in Create/Edit style → Configure. Players opened Effects, Presets, the style picker and the language menu before finding it. One run set the text Fill to pink instead: "Set the current spoken word highlight to pink (#fa90df)", but it had changed the fill.

**Proposed variant `cap-highlight-color`:** a "Highlight colour" row of swatches right on the Captions panel, next to the style, that changes the spoken-word highlight of the current style.

### 3. Export eats the last steps of every flow (all menus)

After "Export clip", players scroll looking for a confirmation, and the quality popup sits over the export controls: "the quality popup kept intercepting the export controls". Most quick runs pass or fail on their final step because of this. It belongs to the Export round, but it inflates every menu's step counts.

**Recommendation:** run the Export round next, before Elements, so the later menus are measured on a fixed export. (Thinh to decide.)

## Next

Build `cap-word-replace` (target C1) and `cap-highlight-color` (target C3). A/B both in parallel against this baseline. The regression set is the other Captions flows.
