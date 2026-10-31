# Preview controls — decisions

## 30 Oct · round 1
- Asked: the safe-zone and zoom controls above the player are too big; make the player look smaller. Propose ideas.
- Proposed (ideas.html): A compact chip group top right · B toolbar under the player (recommended) · C icon strip
  beside the player. All three shrink the player at Fit (438 → 400–420 px at 1440×900) and fix the "33%" label.
- Waiting for: pick / mix / redirect, plus answers to the open questions in brief.md.

## 30 Oct · promoted C
- User: "Go with C. Promote to final design." Open questions answered by the variant as drawn: player gets air at Fit
  (STRIP_FIT 0.92), "No safe zones" stays a menu option, zoom shows the real Fit % (and preview scale is now relative
  to Fit, so 66 % = Fit, 33 % = half).
- On by default as `pv-strip` in `src/variant.ts` (`?variant=baseline` shows the old selects). Legacy x-routes unchanged.
- Files: new `src/shell/preview-strip/PreviewStrip.tsx` + `preview-strip.css`; `src/shell/Preview.tsx` (strip, tag,
  zoom scale, no `.preview-select` when on), `src/main.tsx` (top-right selects hidden when on),
  `src/shell/use-stage-fit.ts` (strip width + fit factor), `src/start/start.css` (strip disabled while booting).
- Templates tab: strip beside the 9:16 preview, safe zone in the "Preview · TikTok safe zone" label, menus open left.
- `npm run check` + `npm run build` pass (note: check-hex.sh needs `rg`, which is missing here; manual grep is clean).
- Next: usability probe "can a newcomer find safe zones?" since the strip is icon-only.

## 30 Oct · C fix 1
- User: "The chip did not move along when change the zoom. Make the player fit to screen."
- Strip and safe-zone tag now follow the zoomed phone's right/left edge (`usePinToPhone` in PreviewStrip.tsx),
  clamped inside the stage, with a short slide.
- Fit fills the stage: no 0.92 shrink, top padding 96 → 40 px when `pv-strip` is on, no controls row under the
  player on the Export side (Templates keeps its source-actions row).
