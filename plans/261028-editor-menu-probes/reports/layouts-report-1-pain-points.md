# Layouts, report 1: pain points on v1

Date: 28 Oct 2026. Build: v1 (commit 2c7cc57, six variants on by default). Players: Codex `gpt-6-luna`, 6 players, 2 runs per player and flow. 40 runs, 12.5M tokens. Runs: `plans/261027-usability-probe-skill/runs/lay-v1-base-1332`. Simulated players, not user research.

## Summary

Quick Layouts jobs are in good shape: picking a layout by name, matching the last clip, moving the camera off the HUD and changing layout late all pass 100%, one step over the best path. The trouble is in two places: giving each part of a split clip its own layout (1 of 4 runs succeed, about 3× the best path), and finding the two-camera layouts (0 of 4).

## Results per flow

| Flow | Who | Success | Median steps / best | Reading |
|---|---|---|---|---|
| L1 camera off the game info | quick | 4/4 | 4 / 3 | fine |
| L5 change layout, keep edits | heavy | 4/4 | 4 / 3 | fine |
| Q1 same as last clip | quick | 3/3 | 6 / 5 | fine |
| Q2 pick split layout | quick | 4/4 | 4 / 3 | fine |
| Q5 no facecam | quick | 3/4 | 3-3.5 / 2 | one run chose Game UI instead of Fullscreen |
| L3 keep 16:9 for YouTube | one-and-done | 3/4 | 4 / 2 | the miss ran out of steps at 4 actions after keeping 16:9 |
| O2 make it vertical | one-and-done | 2/2 valid | 9 / 6 | 2 runs invalid (export dialog click) |
| **L4 two parts, two layouts** | heavy | **1/4** | **20.5 / 7** | pain point 1 |
| **L2 show both faces** | one-and-done | **0/4** | 5-6 / 3 | pain point 2 |
| O3 own upload | one-and-done | 0/4 | 6-8 / 4 | upload, not Layouts; budget |

## Pain points

### 1. Which part does the layout apply to? (L4)

After a split, a layout tile applies to the part under the playhead. Splitting leaves the playhead at the start of the second part, so the next pick lands there. Players set the wrong part and spend 13-14 extra steps checking:
- heavy-explorer #1 split at 9 s and set Basecam on part 2 (`segmentLayouts: {"8.96": "Basecam"}`), then reported success.
- heavy-meticulous #2 set Fullscreen on part 1 and Circle facecam on part 2.
- "I split the clip at about 10 seconds, but the layout changes were left unverified when the editor interaction budget ran out."

The only cue is the subtitle "Applies to the selected segment". It doesn't say which part or show the part's time range.

**Proposed variant `lay-part-picker`:** when the clip has parts, the Layouts panel opens with a row of parts ("Part 1 · 0:00-0:10 · Circle facecam", "Part 2 · 0:10-0:30 · …"). The picked part is highlighted, and tiles apply to it with the label "Applies to Part 1". Picking a part moves the playhead there.

### 2. Two-camera layouts are hard to find (L2)

Dual facecam and Duo Split are the last two tiles in All layouts, below the fold. 3 of 4 runs ended on **Split**: players read "Split" as "split screen with my friend", and one applied the saved "My FPS clips" style (layout Split) from the Reuse block. The one run that found Duo Split ran out of steps while checking whether it had applied.

**Proposed variant `lay-cam-groups`:** group All layouts by camera count, "No camera", "One camera" and "Two cameras", each with one line on what it shows. This also covers the Q5 slip, where Game UI and Fullscreen both start with "Game fills the screen".

## Not Layouts problems (kept out of the A/B)

- **Step budget for novices:** L3, O2 and O3 runs stop at 4-8 actions. This is the open budget-floor question (D6). Until it's decided, one-and-done misses mostly measure patience, not the UI.
- **O3 upload:** "Browse didn't open a file picker" is the upload dialog, and it belongs to the Export round.
- **O2:** two invalid runs where a numbered click landed on the export progress dialog. This is a harness issue, to fix before the Export round.

## Next

Build `lay-part-picker` and `lay-cam-groups` in the lab. A/B each one against this baseline with sequential A/B, targeting L4 and L2+Q5+Q2 respectively; the other Layouts flows are the regression set. Results come in report 2.
