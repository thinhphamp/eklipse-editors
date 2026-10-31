# Start from app.eklipse.gg — decisions

## 30 Oct · Quan: "Go with your recommended"
Recommended answers to the round-1 open questions, now in the prototype (`?start=app`, code in `src/start/`):

1. **4th scenario, captions + channel name: yes.** Picker shows 4 cards in a 2×2 grid. The channel name lands at open,
   captions keep generating after.
2. **Templates panel names the app-picked template: yes.** An "In use" row at the top of Templates: template name,
   "Picked on app.eklipse.gg", and its parts (layout · caption preset · channel name). It goes away once the user
   applies another template.
3. **Caption job time: 4.5 s placeholder kept.** Replace with the real transcription P75 when we have it (`captionJobMs`
   in `src/start/scenarios.ts`).
4. **Captions fail: designed.** Review switch "Captions result: Ready / Fails" on the picker (`&captions=fail`).
   On failure: toast "Couldn't generate captions · the rest of your template is applied", the captions lane turns into
   a dashed warning row with *Try again*, the finish-bar chip reads "Couldn't generate" in warning colour, and the
   Captions tab shows the reason with *Try again* and *Set up captions* (the normal setup). Retry runs the job again.
   Layout and channel name are never rolled back.

Not changed: the default prototype link (v1 baseline used by probes) still opens without the waiting screen.
Checked in Eklipse dark and Light; type sizes use the role tokens.

## 30 Oct · Round 2: waiting screen popup (draft, in review)
Quan: "Redesign the waiting screen popup, show me drafts first." Board: `ideas.html` (current + 3 variants, animated,
switches for template, 2 s / 6 s slow / fails). Prototype not changed.
- **Now**: checklist card over the dimmed poster.
- **A (recommended)**: no popup; the phone preview is the loader. Frame → layout splits in → channel name pops,
  captions slot reserved. One line + thin bar under it.
- **B**: status pill at the top of the stage with a progress ring; expands into detail only when slow or failed.
- **C**: no popup; the video track fills as the clip loads (the track is the progress bar); template card in the panel
  from the first frame.
New edge case designed in all variants: the clip itself fails to load → Try again · Back to my clips, template kept.
Waiting for a pick (A / B / C or a mix, e.g. A + C's track fill).
