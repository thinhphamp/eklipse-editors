# Persona format

One JSON file per persona in `personas/<id>.json`; schema `schemas/persona.schema.json`. Source of the segments and
ranking: `plans/261027-usability-probe-skill/personas.md` (web adoption 5-22 Oct 2026 + paid tier data) [prod].
Record name in Eklipse Quality: PersonaSpec.

| Field | Meaning |
|---|---|
| `id`, `rank`, `name` | Rank 1-4 run by default (`--personas top4`), all 8 for a full sweep |
| `experience` | `new` \| `returning` \| `power` |
| `behavior` | 1-2 sentences: what they do in the editor, from the data |
| `knows` | Things and words they already know. A UI label listed here may appear in a goal |
| `does_not_know` | What they would have to discover |
| `patience` | `low` (gives up after about 2 wrong paths) \| `medium` (about 4) \| `high` (explores) |
| `words` | Phrases they use; goals should sound like these |
| `tier` | Overlay: `free` \| `legacy-premium` \| `standard` \| `pro`. Gated features run Free + one paid tier |
| `fixtures` | `{ "storage": { key: value } }` seeded into localStorage before every run (their history: last layouts, saved styles, brand) |
| `provenance` | Data rows this card is built from (number + source) |

## What the player gets

The runner turns the card into the player brief: name, behavior, knows, does_not_know, patience, words. Never the
`provenance`, `rank` or other personas. Patience sets the give-up guidance in the brief, not a hard rule; the budget
is the hard stop.

## Limits

Personas are segments from saved projects, not interviews; intent is a guess until a real user test. Tier is an
overlay, not a persona (the web data has no plan field).
