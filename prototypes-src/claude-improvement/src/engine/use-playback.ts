import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useEditor } from '../state';
import { getEngine } from './playback-engine';

/** Clock time in source seconds, updated every animation frame while playing. */
export function usePlaybackTime(): number {
  const engine = getEngine();
  return useSyncExternalStore(engine.subscribe, () => engine.time);
}

/**
 * Keeps the store and the engine in step: project data flows into the engine,
 * `state.playing`/`state.playhead` drive play/seek, and while playing the
 * playhead in the store is refreshed ~10×/s for components that don't need frames.
 */
export function usePlaybackBridge() {
  const { state, actions } = useEditor();
  const engine = getEngine();
  // -1 forces the first effect run to seek the engine to the seeded playhead (deep links).
  const lastPushed = useRef(-1);

  useEffect(() => {
    engine.setProject({ duration: state.duration, removedRanges: state.removedRanges, effects: state.effects, audio: state.audio, clipVolume: state.clipVolume, clipMuted: state.clipMuted, splitPoints: state.splitPoints, mutedParts: state.mutedParts });
  }, [engine, state.duration, state.removedRanges, state.effects, state.audio, state.clipVolume, state.clipMuted, state.splitPoints, state.mutedParts]);

  useEffect(() => {
    if (Math.abs(state.playhead - lastPushed.current) > .02) { lastPushed.current = state.playhead; engine.seek(state.playhead); }
  }, [engine, state.playhead]);

  useEffect(() => {
    if (state.playing !== engine.playing) { if (state.playing) engine.play(); else engine.pause(); }
  }, [engine, state.playing]);

  const playingRef = useRef(state.playing);
  playingRef.current = state.playing;
  useEffect(() => {
    let last = 0;
    return engine.subscribe(() => {
      const now = performance.now();
      const playing = engine.playing;
      const playhead = Math.round(engine.time * 100) / 100;
      const playingChanged = playing !== playingRef.current;
      const moved = playhead !== lastPushed.current && (!playing || now - last >= 100);
      if (!playingChanged && !moved) return;
      last = now;
      lastPushed.current = playhead;
      playingRef.current = playing;
      actions.patch({ playhead, playing });
    });
  }, [engine, actions]);
}

