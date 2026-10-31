# Preview controls (safe zone + zoom) — brief (30 Oct)

status: final (variant C, promoted 30 Oct)

## Problem
Above the player, on the right of the stage, sit two controls: the safe-zone select ("TikTok preview ⌄") and the zoom
button ("33% ⌄"). They are 36–38 px tall, 13 px text and ~160 px + ~104 px wide, the same weight as the top bar
buttons. They read as primary controls, pull the eye away from the clip and push the player down
(the stage reserves 96 px above the player for them). The user wants them smaller and the player to look smaller and
calmer in the stage (screenshot `mvv0letc-image.png`, light theme).

Also seen: the zoom button shows "33%" when the zoom is actually "Fit (65.6%)" (`main.tsx` maps any `Fit…` to "33%").

## In scope
- Safe-zone select and zoom control above the player (all tabs except Templates/Layouts).
- The Templates tab's safe-zone select under the preview (`.preview-select`) so both places match.
- How much of the stage the player takes at "Fit".

## Out of scope / stays
- Safe-zone overlays themselves (`SocialOverlay`), zoom levels list, the phone bezel.
- Top bar, timeline, playback bar.

## Files the promotion would change
- `src/main.tsx` (`.stage-tools` / `.stage-selects` markup)
- `src/shell/Preview.tsx` (`.preview-select`, zoom shell)
- `src/shell/use-stage-fit.ts` (PAD_TOP, CONTROLS, fit factor)
- `src/styles.css`, `src/shell/preview.css`, `src/shell/topbar.css`

## Edge cases every variant covers
16:9 output (safe zones off), Templates tab (source + preview side by side), zoom > 100 % (player bigger than stage),
short window / tall timeline, panel collapsed (expand button sits in the same row), booting state (`?start=app`,
controls disabled), all four themes.

## Open questions
1. "Player looks smaller": shrink only the controls, or also give the player more breathing room at Fit (e.g. 85 %)?
2. Keep "No safe zones" as a select option, or make safe zones an on/off with a platform pick?
3. Fix the "33%" label to show the real Fit value ("Fit · 66%")?

## Parking lot
- Remember the last safe-zone platform per user (ties to the "last platform picked" preference).
