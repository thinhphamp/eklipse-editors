# Audio, report 1: pain points on v1

Date: 28 Oct 2026. Build: v1, fixed harness. Players: Codex `gpt-6-luna`, 2 runs per player and flow. 20 runs, 6.4M tokens (3 runs invalid, to be rerun). Runs: `plans/261027-usability-probe-skill/runs/aud-v1-base-2250`. Simulated players, not user research.

## Results per flow

| Flow | Who | Success | Steps / best | Reading |
|---|---|---|---|---|
| A1 add background music | one-and-done | 3/4 | 7-10 / 5 | fine |
| A3 a sound effect on the kill | quick | 3/4 | 7-8 / 5 | fine: every run put "Headshot" at 0:28 |
| A5 music fades out at the end | heavy | 3/3 valid | 9-12 / 6 | fine |
| **A2 turn the music down under your voice** | quick | **0/4** | 9 (budget) / 6 | pain point 2 |
| **A4 music comes in after the start** | heavy | **0/2 valid** | 12-17 / 6 | pain point 1 |

## Pain points

### 1. Music start time can only be set by dragging (A4)

To make the music come in later, you drag its chip on the timeline. The music panel's **Trim audio: Cut the beginning** looks like the answer, but it only skips the first seconds of the song. The song still starts at 0:00. One player did exactly that, then tried to drag the chip and failed: "set its start to about 6 seconds into the clip". The music ended at 0:00 with a 6 s offset.

Third menu, same root cause: Elements (sticker length, meme start), Effects (zoom lands at 0:00) and now Audio. **Recommendation:** one shared timing row for every item on the timeline: "Starts at m:ss · Move to playhead · Show for − N s +". It is already built as `el-timing` and `fx-timing`; extend it to audio as `aud-timing`, and rename "Cut the beginning" to "Skip the start of the song".

### 2. Setting a volume level costs too many steps (A2)

Players lowered the music to 20%, 29%, 48% and 50%. The two that went low enough ran out of steps before export. The two that stopped near half read "low" as "half". The volume is a bare slider with no number or quick setting.

**Proposed variant `aud-volume-quick`:** show the volume as a number, and add a "Lower under voice (25%)" quick button.

### 3. Missing control: the game's own sound (not testable)

There is no control to lower or mute the clip's own sound, for the whole clip or for one part. `clipVolume` exists in the state but nothing sets it. "Mute the game for one part" couldn't be written as a flow. This is a product gap, not a usability result.

## Next

1. Rerun the 3 invalid runs.
2. Build `aud-timing`, reusing `fx-timing` once its A/B is done, and `aud-volume-quick`.
3. A/B both in parallel, with targets A4 and A2.
