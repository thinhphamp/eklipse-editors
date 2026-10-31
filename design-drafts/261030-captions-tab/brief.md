---
feature: captions-tab
status: final
---

# Captions tab: match what production supports, then simplify

## Goal
Change the prototype's **Captions** rail tab so it covers what the production Auto Captions menu supports today
(`mvufhsjm-image.png`, `mvufixne-image.png`), and fix the known pain points, without bringing back a style studio.

## Production vs prototype today

| | Production (Auto Captions) | Prototype today (`src/tabs/captions/`) |
|---|---|---|
| Before generating | One screen: Caption language, **Caption format** (Word by word / Full phrases), **Auto emoji** toggle, Generate | Hidden behind a globe button: language + 3 preset buttons + Generate. No format, no emoji |
| After generating | Tabs **Captions / Settings / Styles** | Tabs **Text / Effects / Presets**, plus "Show all tracks" and "View all captions" |
| Edit text | One row per line with time range (`00:00:46:04~00:00:47:10`), click to edit, **+ Add a Line** | Sentences of word buttons; click a word → edit field (cursor at end, appends: probe C1), ±0.1 s timing, merge, split, delete |
| Word by word | Format choice, up front | Only via the "One word at a time" animation inside the style modal |
| Emoji | Auto emoji toggle, up front | Effects → Emojis, after generating; its description is wrong ("Assign unique styles per speaker": `effectDescriptions` index is off by 2) |
| Highlight colour | — | Style modal → Configure (probe C3: 2/4 success, 19-27 steps against 9) |
| Styles | Styles tab | 11 preset groups; selected tile has "Edit" → full style modal (Style / Effect / Configure / Speakers), against the rule "pick a preset only" |

## Common model (same in every variant)
1. **Language, Format, Auto emoji and Style are chosen before Generate**, with a live sample on the video, and stay
   editable after. Format, emoji, style and highlight change live; only a language change needs new captions.
2. **Lines, not words.** One row per line with its time range, click to edit (text selected, Enter saves, Esc
   cancels), × to delete, **+ Add line** at the playhead. Fixes C1 by design.
3. **Highlight colour on the panel** (6 swatches + None). Fixes C3.
4. ~~Presets only~~ → round 2: **presets of style are editable again** (font, weight, colours, stroke, highlight), saved as
   "My presets of style".
5. **Remembered for the next clips**: format, emoji, style, highlight (local storage + saved templates).
6. Regenerate after edits asks first ("Replaces your N edits").

## In scope (files the promotion will touch)
`src/tabs/captions/Captions.tsx`, `TranscriptEditor.tsx` (line rows), `catalog.ts` (fix effect descriptions),
`model.ts` (`singleWord` becomes the Format setting), `Captions.css`, `caption-controls.css`,
`variants/HighlightColorRow.tsx` (reused). `StyleEditor.tsx` / `StyleConfigure.tsx` / `StyleFields.tsx` drop out of
the panel flow. `shell/PreviewCaption.tsx` only for the before-generate sample.

## Out of scope / parking lot
- Caption position presets per layout (preview toolbar Top / Middle / Bottom stays).
- Speakers / multiple speakers (one speaker per clip, product rule).
- "Show all tracks" (timeline concern, unchanged).
- Translating captions after generation.

## Round 2 (user, 30 Oct)
Wording: **preset of style**. Keep the prototype tabs (Text · Effects · Presets); change only the before-generated
screen and how text shows; bring back editing a preset of style. → `variants/D.html`.

## Open questions
1. Production edits **whole lines**; the prototype also lets you fix **timing per word** (±0.1 s, merge, split). Keep
   per-word timing (inside the line editor), or lines only like production?
2. Should Format and Emoji live **only before generating** (like production) or stay changeable after (all variants
   assume after)?
3. Tab name: **Captions** (rail today) or **Auto Captions** (production)?
4. Default for a first-time user: Full phrases + Auto emoji on (production screenshot) — confirm.
