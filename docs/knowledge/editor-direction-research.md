# Editor direction research — 26/10/2026

Research before planning, requested by Thinh. Sources and recommendations: `plans/261026-editor-direction-research/{recommendation.md,astra-advice.md}`. Local review board: `brainstorm/review.html`. No user selection, design approval, implementation, deployment or Jira write in this session.

| Finding | Environment / confidence | Source |
| --- | --- | --- |
| Reference prototype shows source + output only in Layouts; other tools use output preview. | [local prototype], Verified code; Layouts also inspected in daily Chrome 26/10 | `prototypes-src/streamladder-editor-ref/src/shell/Preview.tsx`; research `prototype-current.jpg` |
| Layouts hides non-video timeline lanes; choosing element/audio/effect chips changes the active tab and opens item properties. | [local prototype], Verified code; usability impact untested | same source `shell/Timeline.tsx` |
| Export is the sixth rail tab. Overview includes reference product tools such as ClipGPT/Emote Maker; these do not imply Eklipse product scope. | [local prototype], Verified code; Export also seen in runtime | `shell/Rail.tsx`, `shell/Overview.tsx` |
| Dataset1042 and1066 SQL counts project export using existence of a job, without requiring completed status. They cannot be reused unchanged as successful-export measures. | [prod Superset catalogue], Verified read-only metadata 26/10 | query125463 on db15; no dataset changes |
| Plans2/4/6 are named premium / Standard Premium / Premium Pro. Names alone do not establish tier at a historical action or behavior differences. | [prod], Verified bounded query 26/10 | query125471 on db3; code mapping `v3-api/app/Services/TierEntitlementService.php:53` uses config IDs |
| Usage probes125467/125472 timed out, were explicitly stopped and subsequently reported failed. No findings from these probes;125472 used incorrect status complete, not completed. | [prod], no usable behavior result | SQL Lab query metadata; source status in editing `numbers.md` A3/A4 |
| Astra and lead recommend main output canvas, contextual properties and stable timeline; A is smaller shell refinement, C is task workspaces. | Recommendation, not user decision or tested usability improvement | research `astra-advice.md`, `recommendation.md` |

Historical Premium editing figures remain defined by their original purchase-window cohort and source dates. They do not establish current Pro usage. Pro Edit human service and Premium Pro subscription must remain separate. Full-parity/open-MVP decision from22/10 is preserved; suggested default/advanced visibility is not a scope reduction. Current behavior analysis by historical tier and feature-control usage remains incomplete.

## Separate prototype requested and built, 26/10/2026

Thinh explicitly delegated best-option selection to Astra and requested a separate “codex improvement” prototype plus report. Astra selected B; fork source is `prototypes-src/codex-improvement`. Reference source hashes remain unchanged. This is prototype authorization, not completed-design approval or implementation scope.

Local verification: template caption/cuts preservation and segment scope, real local save/reload, error/retry, corrupted draft retention, review-route isolation, native crop drag/Undo and simulated export success/retry. Built five-tool sweep at1280x720 retained six populated lanes with no panel overflow/console error. Report checked at1280 and390px, images and EN/VI toggle working. Full inherited-control coverage and real output encoding remain unverified. Artifacts: `codex-improvement-spec.md`, `codex-improvement-qa.json` in the research folder.

## Report rationale added, 26/10/2026

Report now maps B and P01–P06 to dated user data D1/D2, prototype/code observations or primary NN/g guidance. D1 retains E3a–E3c/A4 definitions; D2 retains B1/query117001 and is explicitly not an ordered project funnel. Each decision states its inference, uncertainty and proposed validation. Exact panel position, default safe zones and a stationary playhead remain design hypotheses. Primary references re-read26/10: NN/g Progressive Disclosure, Complex Application Design and10 Usability Heuristics. No new business query or prototype change in this report revision.

Report context correction, 26/10: Thinh noted that “Why Astra chose B” lacked the A/B/C alternatives. The report now defines all three before the choice, with conceptual diagrams, the same caption→crop example, tradeoffs and explicit build status. Only B is built; the unchanged reference is not an implemented A. Generator assertions require all three options before the decision in both languages.

## Derived interpretation for the report, 26/10/2026

| Derived detail | Status and definition | Source |
| --- | --- | --- |
| 823 / 92 = about8.9: studio weekly creator count relative to montage | Arithmetic on rounded historical weekly means, not exclusive market share; cohorts overlap | D1, numbers.md E3a/E3c, original query read12/10 |
| 1,423 − 1,036 =387 starters with no same-week web export/render;387/1,423≈27.2% | Historical B1 cohort, week28/9–4/10. Not failed exports or ordered project conversion; completed exports may belong to older projects | D2, query117001, read12/10 |
| 455 / 1,036≈43.9%: exporters with no same-week Eklipse non-live share attempt | Historical B1; external publishing unobserved. Does not establish editor friction or lack of motivation | D2, same query117001 |

Report now distinguishes observed/derived detail, selected prototype decision, expected user effect, harm/guardrail, metric and conditions for keeping the change. Benefits remain hypotheses unless verified as local correctness. No retention/share uplift is forecast.

## Reading-structure preference, 26/10/2026

Thinh preferred the content organization of Claude's local report at localhost:4318/report.html?lang=vi. Read it in daily Chrome without edits. Applied that reading structure to Codex: direction → dated data → one four-column evidence/detail/decision/impact section → short changes → feature visibility → alternatives → try → QA/limits → sources. Methods, risks, deeper examples and screenshots stay expandable. The Codex figures/cohorts/conclusions were retained; the other report's newer figures and conclusions were not imported. Desktop/mobile, language toggle, anchors and text disclosures checked; see scoped QA for the stalled final image check.

## Recurring social identity, 26/10/2026

Thinh identifies social stickers as recurring brand identity. This qualitative product input supports prioritizing Social Stickers in Elements; it is not measured Premium/Pro frequency and does not imply consent to automatic insertion. Astra recommends explicit reuse. Codex fork now saves a local set (platform, username, design/style, animation, normalized position), applies to the whole target clip with one Undo, replaces managed instances and reuses original saved items, preserving other manual stickers. Social Stickers is a separate template category; selecting it replaces that category. Fresh/screen review storage is isolated. Report P07 traces input → interpretation → decision → expected effect and validation. QA: plans/261026-editor-direction-research/social-branding-qa.json. Concurrent session owns Branding.tsx/branding-store.ts; this set uses MyBranding.tsx/my-branding-store.ts.

## Combined Codex / Claude review, 26/10/2026

Standalone local report: reports-src/editor-comparison/build.py, preview port 8777. Seven common intentions, twelve feature comparisons, seven Claude-only additions and six Codex-only additions. Astra advises Codex preservation/recovery/explicit branding plus Claude style discovery and export quality/shortcut conveniences. Current source and L00 runtime show both omit empty timeline lanes; do not infer a disagreement from populated screenshots. Claude constant Saved status has no matching project draft persistence; Export & post is a toast plus mock render, not publisher navigation. Claude demo styles reset words/crops/segments; Codex scoped styles preserve content but do not generate missing captions or reuse music. Claude current-tier mobile contents cannot rank web tasks, and render-job/project-count ratios cannot establish distinct-project completion. No fresh SQL or user test performed. Sources, Astra review and QA: plans/261026-editor-comparison/. Neither fork changed during the report task.

Combined-report visual correction, 26/10: Thinh requires screenshots to review UI changes; a text-only comparison was insufficient. Added the unchanged reference plus eight real Codex/Claude scene pairs (workspace, framing, styles, inspector, timeline, Export, branding and save status), yellow callouts, focus crops and full-size viewer. All twelve decisions link to screenshot scenes; generator assertions require coverage and source images. Photos use daily Chrome in an isolated local-review context; synthetic handles, no production/user preference writes. See editor-comparison/screenshot-manifest.json and visual-qa.json in the plan directory.

Hub publication authorized and completed, 26/10: reports at /reports/editor-comparison, /reports/codex-improvement and /reports/claude-improvement; clickable variants at /prototypes/{codex-improvement,claude-improvement}/prototype. Isolated Hub copy deployed, then only five new content folders and six unchanged-since-snapshot navigation/test/index files persisted to the canonical Hub. Synthetic demo identities and absolute same-origin assets; the reviewed UI choices remain unchanged. Authenticated checks rendered five pages and 17 comparison images; anonymous access to nine routes/assets returned 302 to login; 20 auth/search tests passed. Local-only release snapshot commit 676cf96. Deployment record: plans/261026-editor-comparison/hub-release.json.

## Web editor feature adoption, 2026-10-05 to 10-22 (re-check 27/10/2026)

Source: Thinh's `editor_feature_adoption_report.md` (sent 26/10), 19,562 web projects / 3,695 users from saved project files. [prod] *assumed*; all users, no tier split; associations only. Re-check of the Claude proposal: `plans/261026-1500-editor-direction-claude/recheck-261027-web-adoption.md`.

| Finding | Environment / confidence | Source |
| --- | --- | --- |
| 63.5% of web projects exported; median 3.2 min to first export. | [prod] assumed, file data | adoption report, headline |
| Same-user export gaps: text +45.9, trim +39.2, user meme +32.7, split +30.8, auto captions +29.4 (12.2% use, +1.8 min); AI-placed meme −4.1. | [prod] assumed, association | adoption report §1 |
| AI memes left untouched export 44.4% vs 72.9% when the user also edits; 89.1% of AI-meme projects also have zoom. | [prod] assumed, association | adoption report §5 |
| 72.6% of projects reuse the previous layout (76.5% vs 52.8% export). | [prod] assumed, association | adoption report §3 |
| First project exported under 2 min → 79.0% return within 7 days (overall 52.9%). | [prod] assumed, association | adoption report §2 |
| 8.2% of projects keep horizontal footage at 16:9 and export 41.0% vs 66.0% for 9:16. | [prod] assumed, association | adoption report §4 |
| Channel-name sticker in 73.1% of projects; 86.8% use one platform. | [prod] assumed, file data | adoption report §3, §6 |
