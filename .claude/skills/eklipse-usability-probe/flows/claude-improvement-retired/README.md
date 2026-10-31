Flows removed from the active set. cap-rename-speaker and cap-highlight-pink (2026-10-29): Eklipse captions have one speaker and no style studio (pick a preset only), so these goals test features that are not planned.
lay-two-parts and lay-relayout-keep-edits (2026-10-30, round 3): prototype v2 (CTO build) applies a template to the whole clip, so per-part layouts and "keep my edits on re-layout" no longer exist. variants/claude-improvement-retired/lay-part-picker.json goes with them.

fx-cut-dead-air and fx-funny-voice-line (2026-10-31, v3): the CTO build of 30 Oct takes "Remove silences" and "Text to speech" off the Effects menu (`rootCards` in `src/tabs/effects/EffectsData.ts`); they are not reachable from a fresh clip any more.

Round-3 variants ch-click-to-apply, ch-multi-visible, el-moving-link, tpl-one-save, tpl-names-what-changes and tpl-confirm-apply (2026-10-31): the prototype source was replaced with the CTO build of 30 Oct (v3), which does not carry their code. Results stay in `plans/261030-cto-review-round3/reports/round3-report-2.md`; the plans are in `variants/claude-improvement-retired/`.
