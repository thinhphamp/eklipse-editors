---
feature: templates-menu
status: final
---

# Templates menu (was "Layouts")

## Goal
Rename the **Layouts** rail tab to **Templates** and restructure its panel around two kinds of templates:

- **Saved templates**: made by the user. A saved template carries the layout and crops plus whatever the user
  included when saving (captions, text, stickers, sounds, effects). Today: `template-store.ts` (`ek-proto-templates`)
  and the demo style kits in `style-kits.ts`.
- **All templates**: the Eklipse presets, one per layout in `src/data.ts` (`Small facecam` … `Half`), each with a
  caption style and a social sticker.

The main Eklipse app already shows this split in the "Edit clip" modal: `All 21` / `★ My saved 10` pill tabs over a
row of 9:16 cards (see `mvtr2a03-image.png`).

## Current state (v1, final today)
`src/tabs/layouts/Layouts.tsx`, panel title "Choose your layout":
1. "Reuse a look" block: `+ Save as my look`, the saved style card ("Your style · My FPS clips"), "Your last clip used …".
2. "Recently used" row (layouts of the last exported clips).
3. "All layouts" grid with one-line descriptions (`layout-describe`).
Plus situational parts: "Make it vertical" card on 16:9 clips, part picker on split clips (`lay-part-picker`, not promoted).

## In scope
`src/data.ts` (tab name), `src/shell/Rail.tsx` (icon), `src/tabs/layouts/*`, `src/tabs/export/style-kits.ts`,
`template-store.ts`, `LookSaveAction.tsx`, icon map. Usability-probe flows that say "Layouts" will need relabeling.

## Out of scope / parking lot
- Saving from the Export panel (stays as is this round).
- Sharing templates between users / team templates.

## Answered (29 Oct, round 1)
1. Templates apply to the **whole clip**, also when it is split into parts.
2. Eklipse templates are presets: **layout + caption style + social sticker**.
3. **Rename and delete inside the Templates panel.**

## Still open
- Caption style + sticker pairing for each of the 11 Eklipse templates (B2 and C2 draft one from the Captions catalog).
