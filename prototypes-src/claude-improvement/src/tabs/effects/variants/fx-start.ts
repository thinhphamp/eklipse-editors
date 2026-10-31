import { keptRanges, outputToSource } from '../../../engine/timeline-map';
import { hasVariant } from '../../../variant';
import type { EditorState } from '../../../state/types';

// Variant fx-timing: a new effect starts at the playhead (source time, clamped so it fits the clip).
// With the variant off this returns the old value, so baseline behaviour is unchanged.
export function fxStart(state: EditorState, duration: number, old: number): number {
  if (!hasVariant('fx-timing')) return old;
  const kept = keptRanges(state.removedRanges, state.duration);
  return Math.min(Math.max(0, outputToSource(state.playhead, kept)), Math.max(0, state.duration - Math.min(duration, state.duration)));
}
