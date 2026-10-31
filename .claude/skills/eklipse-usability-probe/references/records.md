# Run records

Names follow Eklipse Quality (`plans/261021-0913-eklipse-quality-tool/engineering-contracts.html`), trimmed to what
probes need, so Quality can read probe runs later. No shared code or store.

## Observation (ObservationEvent), one line per action in `actions.jsonl`

```json
{ "runId": "2026-10-27/layouts-find-by-look/first-clip-newcomer/1", "sequence": 3, "timestamp": "2026-10-27T10:31:02.114Z",
  "action": "click", "target": "button \"Layouts\"", "screenshotRef": "003.jpg", "outcome": "ok", "note": null }
```

`outcome`: `ok` \| `no-target` (nothing at that point/label) \| `error` \| `stopped`.

## Finding

```json
{ "id": "F-layouts-01", "observationRefs": ["<runId>#3"], "feature": "Layouts", "classification": "friction",
  "confidence": "medium", "quote": "I expected the layouts under Elements", "resolutionState": "open" }
```

`classification`: `friction` \| `blocked` \| `bug` \| `idea`. `resolutionState`: `open` \| `variant-testing` \| `fixed` \| `wont-fix`.

## Review

```json
{ "findingId": "F-layouts-01", "reviewer": "thinh", "decision": "accept", "rationale": "Matches the 16:9 data" }
```

`decision`: `accept` \| `defer` \| `reject`. Thinh's `pick` / `veto` / `promote` on variants are Reviews too.
