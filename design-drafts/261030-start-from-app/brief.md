# Start from app.eklipse.gg — brief (30 Oct)

The user picks a clip and a template on app.eklipse.gg, then lands in the editor. Loading takes a few seconds
(P75 = 2 s). The editor opens with the video track only and shows a waiting screen while the clip loads.

Scenarios (what the picked template carries):
0. Captions + channel name: both; channel name at open, captions generate after.
1. Captions: layout + captions. Captions start generating when the clip is open and keep running while the user edits.
2. Channel name: layout + the saved channel name sticker, placed when the clip is ready.
3. Layout only: no captions, no channel name; the timeline stays video only.

Prototype: `prototype.html?start=app` (scenario picker), or `?start=app&scenario=both|captions|channel|layout&load=1000|2000|6000[&captions=fail]`.
Without `start=app` the prototype is unchanged. Code: `src/start/`.

Waiting screen: editor shell at once (rail, top bar, video-only timeline with shimmer), stage card over the clip poster
(Loading clip → Applying layout → Adding channel name; captions listed as "start when the clip is open"), panel skeleton,
Export and playback disabled. Slow (> 4 s): "Taking longer than usual" note.
Captions running: striped progress on the captions lane, "Captions on the way" pill on the preview, spinner on the
Captions rail item, "Generating…" in the finish bar, a status view if the Captions tab is opened. Done → toast + captions.

Decisions: see decisions.md.
