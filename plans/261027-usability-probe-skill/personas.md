# User matrix: 3 personas × flows × scenarios × behaviors (personas and score approved 27 Oct; behaviors and flows in review)

Source: `editor_feature_adoption_report.md` (web editor, projects created 5-22 Oct 2026, 19,562 projects, 3,695 users, final saved state joined to export) [prod]. Gaps are associations, not causes. The previous 8 data segments (git history of this file) are retired for scoring; their numbers live on as flow weights below.

A **player** = one persona + one flow + one scenario (user state) + one behavior. The agent acts as that user, with that user's expectations, and plays the flow from a raw clip to the clip the user wants.

## 1. Personas

| Persona | Who, from the data | Size | Export / time | Goal the score rewards |
|---|---|---|---|---|
| **Quick user** | Light editing (≤ 3 feature groups), reuses last layout, keeps defaults, AI clip, Twitch sticker | Light depth 68.1% of projects; layout reused 72.6%; sticker font kept 84.7% | 63.4% export, median 2.2 min; 76.5% export when the layout is reused | Fewest clicks from open to export; "same as last time" in one action |
| **Heavy editor** | Medium + heavy depth, edits AI output, adds text, trim, split, own memes, captions, music, restyles captions, 2+ platform sticker | Medium 29.0% + heavy 2.9%; trim 22.9%, captions 12.2%, split 8.7%, own memes 6.2%, text 5.8%, music 3.8% | Heavy 80.0% export, median 15.1 min | Every tool reachable fast, in their usual order; finding a named item quickly |
| **One-and-done user** | First project in the period, does not export or does not come back | 63.4% of first projects not exported (1,997 of 3,150); 47.1% do not return in 7 days; 47.4% of users never exported | First export median 4.8 min; export under 2 min → 79.0% return vs 45.0% without export | First export with no knowledge of the tool; understand what the AI added |

Overlap: one-and-done users are mostly light editors on their first clip; the persona is defined by the user state (no history), not by depth.

## 2. Behaviors (how the player acts)

| Behavior | Used by | Acts like |
|---|---|---|
| Rusher | Quick user, one-and-done | Takes the first plausible control, low patience, gives up after ~2 wrong paths |
| Explorer | Heavy editor | Browses panels, uses search and suggestions, compares options; tries one, and if it does not look right, picks another (meeting 08:47) |
| Meticulous | Heavy editor | Checks the preview after each change, fixes small details (font, position, timing) |
| Novice | One-and-done | Does not know tool names, reads labels literally, needs to see what the AI did |

## 3. Scenarios (user state, already in `targets/claude-improvement.json`)

`fresh-user` (no history), `demo`, `exported-no-style`, `style-matches-last`, `style-differs-from-last`. Clip states to add: AI edit bundle on (20.1% of projects; 89.1% also zoom, 61.8% SFX), horizontal source kept 16:9 (8.2%, 41.0% export), vertical source (6.3%), user upload (16.8%).

## 4. Flows (first 12; grow to ~50 later)

Templates are not a flow: one-click templates are a variant to propose after the baseline report (Thinh, 27 Oct). H4 approved without an export step.

Weight = share of that persona's clips the flow stands for (rough, from the report). Expected output is what the judge checks at the end.

| # | Persona | Flow (end to end) | Input clip | Weight | Data behind it |
|---|---|---|---|---:|---|
| Q1 | Quick | Open clip → same look as last clip → reframe (face not cut off) → export | default | 0.35 | Layout reused 72.6%, export 76.5% vs 52.8% |
| Q2 | Quick | Open clip → pick a layout (split cam top) → export | default | 0.15 | Split cam top 19.8%, full game 17.9% |
| Q3 | Quick | Open clip → auto captions, default style → export | default | 0.10 | Captions +29.4 same-user, +1.8 min |
| Q4 | Quick | Open clip → trim the slow start → export | default | 0.10 | Trim 22.9%, +39.2 same-user |
| Q5 | Quick | No-facecam clip → gameplay fills the frame → export | no facecam | 0.15 | No layout 14.3% of projects, 54.7% export (below average) |
| Q6 | Quick | Clip 1: captions in a chosen style → save as my style; clip 2: apply it in one action → export | two clips | 0.15 | Meeting 03:19 to 04:13 |
| H1 | Heavy | Layout → captions + restyle → find music → zoom → channel sticker → export | song not in the music list | 0.35 | Meeting flow; caption style changed 62.5%, 85.3% export |
| H2 | Heavy | Trim/split → named meme ("Another One") → title text → SFX → export | default | 0.30 | Own memes +32.7, text +45.9, split +30.8 |
| H3 | Heavy | Fix the AI edit: remove one AI meme, move one, add own meme → export | AI edit on | 0.20 | AI memes untouched 44.4% vs edited 72.9% |
| H4 | Heavy | Brand: sticker with YouTube + Twitch, change handle, save as my style | default | 0.15 | 2+ platforms 9.7%, 79.4% export |
| O1 | One-and-done | First clip with AI edit → see what AI added → export | AI edit on | 0.50 | First export under 2 min → 79.0% return |
| O2 | One-and-done | Horizontal clip → make it vertical → captions → export | wide 16:9 clip | 0.30 | 16:9 kept 41.0% vs 66.0% |
| O3 | One-and-done | Own upload (vertical source) → fitting layout → export | vertical upload | 0.20 | Vertical to 9:16 median 5.3 min |

## 4b. Players (6) and what they play (Thinh, 27 Oct: player = persona + scenario + behavior, and plays flows)

A player is a user: persona + user state (scenario) + behavior. Each player plays every flow of its persona. The clip a flow starts from (AI edit on, wide 16:9, no facecam, vertical upload, song not in the music list, two clips) is the flow's input, not part of the player.

| Player | Persona | Scenario (user state) | Behavior | Plays |
|---|---|---|---|---|
| quick-match | Quick user | style-matches-last | Rusher | Q1 to Q6 |
| quick-differs | Quick user | style-differs-from-last | Rusher | Q1 to Q6 |
| heavy-explorer | Heavy editor | exported-no-style | Explorer | H1 to H4 |
| heavy-meticulous | Heavy editor | exported-no-style | Meticulous | H1 to H4 |
| once-novice | One-and-done | fresh-user | Novice | O1 to O3 |
| once-rusher | One-and-done | fresh-user | Rusher | O1 to O3 |

Flow inputs: Q5 no facecam, Q6 two clips, H1 song not in the music list, H3 AI edit on, O1 AI edit on, O2 wide 16:9 clip, O3 vertical upload; the rest start from the default clip.

26 player-flow pairs. A flow's weight is split evenly across the two players of its persona. Runs per sweep: 26 × 3 = 78 on the main model plus 26 check runs (A/B: 5 runs on targeted pairs). Some pairs are weaker tests (e.g. Q1 when the style already matches) and stay in on purpose: a design must not slow them down.

## 5. Persona weights for the overall score

Proposal: Quick 0.45, Heavy 0.25, One-and-done 0.30. Quick is the volume; one-and-done is the retention lever (users, not projects); heavy is small but pays more. Thinh to confirm.

## Limits

- Final saved state only: deleted AI memes and template names are not visible, so "same as last time" is measured by layout reuse.
- Minutes are wall-clock from creation to first export, idle included. The simulator measures clicks and modeled time, not real time.
- An LLM player is a filter, not a user test.
