# Re-check of the Claude editor proposal against web adoption data — 2026-10-27

New data: `editor_feature_adoption_report.{md,html}` sent by Thinh on 2026-10-26 (copy kept outside the repo in `~/Downloads`). It covers web editor projects created 2026-10-05 to 2026-10-22: 19,562 projects from 3,695 users, read from saved Meishe project files and joined to export status. Environment is not stated in the file; treated as [prod] *assumed*. All users, no tier split.

The old proposal (`report.md`) was built on mobile export JSON for paid users and said the web project contents were not measurable. This data fills that gap. Every gap below is an association: users who plan to post a clip also edit it more.

## Verdict per suggestion

| ID | Suggestion | Verdict | Evidence from the new data |
|---|---|---|---|
| C1, C7 | Fixed Export in the top bar, export dialog, ⌘E | **Supported** | First project exported in under 2 min → 79.0% come back within 7 days, vs 45.0% when not exported. Median to first export 3.2 min. |
| C3 | My styles (layout + caption + music in one step) | **Supported, change the bundle** | 72.6% of projects reuse the previous layout and export at 76.5% vs 52.8%. Caption style is changed in 62.5% of caption projects, so the style is worth saving. Background music is in only 3.8% of projects and its raw gap is −2.1: make it optional in the bundle, not a core part. |
| C4 | Layouts panel: Your style → Recently used → All | **Supported** | Same layout-reuse numbers. Layout preset is in 85.7% of projects (+17.4 same-user). "No layout" (14.3%) exports at 54.7%. |
| C2 | Rail ordered by usage: Layouts, Captions, Audio, Effects, Elements | **Revise** | Order by value, not by raw usage. Text/title (+45.9 same-user) and user-added memes (+32.7) are in Elements, last on the rail. Music (Audio) is weak. Proposed: Layouts, Captions, Elements (text first), Effects, Audio. |
| C5 | Timeline keeps every lane with content | **Supported** | Trim (22.9%, +39.2) and split (8.7%, +30.8) are among the strongest gaps. Trim and split should stay one click away on every tab. |
| C6 | Finish bar chips Brand / Layout / Captions / Music | **Revise** | Swap the Music chip for Title (add text) and keep Captions. Captions: 12.2% use, +29.4 same-user for +1.8 min, the best value for the time spent. |
| C8 | Brand sticker on by default, set up once | **Supported, extend** | Channel-name sticker is in 73.1% of projects (keep and protect, +3.8). 86.8% keep one platform. Projects with 2+ platforms export at 79.4% vs 61.8% (raw). Answer to open question 4: one sticker per account that can list several platforms, with an "add platform" prompt during setup. |
| §2 | No object inspector, because text and stickers are rarely used | **Revisit** | That reasoning came from mobile (sticker 0.4%). On the web, text is rare (5.8%) but has the biggest gap. A light inline text editor on the canvas is worth testing; a full inspector is still not justified. |
| §6 | Tracking to add | **Update** | Feature use can now be derived from saved files. Events are still needed for what the files cannot show: AI memes the user deletes, export source, and time to export. |

## New findings the old proposal does not cover

1. **AI auto-edit output (biggest gap).** AI memes left untouched: 44.4% export (3,205 projects). AI memes plus one user edit: 72.9%. AI-placed meme −17.2 raw, −4.1 same-user ("fix"). 89.1% of AI-meme projects also get the zoom effect and 61.8% get sound effects. Proposal C9: after AI Edit, show a short review row ("AI added 3 memes, zoom, sound") with keep/remove per item, plus one suggested edit (trim, title or captions). Also test fewer AI memes per clip. Track `ai_item_removed`.
2. **Clips that stay 16:9.** 8.2% of projects keep horizontal footage at 16:9 and export at 41.0% vs 66.0% for 9:16. Premium clips stay 16:9 most often (17.2%). Proposal C10: when the output is 16:9, the Layouts panel opens with a "Make it vertical" card using the user's last layout.
3. **Caption highlight on by default is right.** Kept in 92.5% of projects; kept 83.3% vs changed 69.7% export.
4. **Weak layouts.** Cam circle overlay (14.3%, 56.4% export) and Game lower 2/3 (42.4%) are below the average of 63.5%. Worth a visual check of their output before changing the order of All layouts.
5. **Key metrics.** Add first-project time to export and 7-day return (52.9% today) to the two metrics in §6.

## Limits

- All users, not paid users. The old design targeted paid users; whether these patterns hold for paid users only is unknown. Ask whether the data has a plan field.
- Final saved state only: deletions are invisible, and projects may be edited after export.
- Same-user gaps remove differences between users but not intent per clip.
- Mobile figures in the old report stay valid for mobile; do not mix them with these web figures.

## Implemented 2026-10-27 (local, waiting for Thinh's review)

- Prototype `prototypes-src/claude-improvement`: C2 rail order (`src/data.ts`), C3 demo style without music (`src/tabs/export/style-kits.ts`), C6 Title chip (`src/shell/FinishBar.tsx`, `src/shell/title-element.ts`), C9 AI review strip (`src/shell/AiReview.tsx`, `ai-review.css`, screens R01/R02), C10 16:9 output (`outputRatio` in state, letterbox in `LayoutCanvas.tsx`, card in `Layouts.tsx`, screen H01). "What changed" lists C1 to C10.
- Report: `build_report.py` rewritten English only (rule 2026-10-26), with a re-check section, web evidence table, chain E1 to E10, C9/C10 cards. Old bilingual generator not kept in the repo (git history has it).
- QA: `scripts/shot-recheck.mjs` at 1600×900 and 1280×800, screenshots in `qa/recheck/`; old `shot-claude.mjs` re-run in `qa/recheck/regress/`. No console errors.
- Not done yet: Hub publish (prototype copy + report wrap + images), Jira. Waits for review.
