import type { Range, TrackItem } from '../state/types';

export type { Range };

/** Segments between split points, in source seconds. */
export function segments(splitPoints: number[], duration: number): Range[] {
  const cuts = [0, ...splitPoints.filter(t => t > 0 && t < duration).sort((a, b) => a - b), duration];
  return cuts.slice(1).map((end, i) => ({ start: cuts[i], end }));
}

/** Complement of the removed ranges inside [0, duration]. */
export function keptRanges(removed: Range[], duration: number): Range[] {
  const out: Range[] = [];
  let t = 0;
  for (const r of [...removed].sort((a, b) => a.start - b.start)) {
    if (r.start > t) out.push({ start: t, end: Math.min(r.start, duration) });
    t = Math.max(t, r.end);
  }
  if (t < duration) out.push({ start: t, end: duration });
  return out;
}

/** Where playback should be: `t` itself, the start of the next kept range, or null at the end. */
export function playablePosition(t: number, kept: Range[]): number|null {
  for (const r of kept) {
    if (t < r.start) return r.start;
    if (t < r.end - 1e-3) return t;
  }
  return null;
}

export const keptDuration = (kept: Range[]) => kept.reduce((sum, r) => sum + r.end - r.start, 0);
/** Map a source clock into the compact edited timeline. Removed time clamps to its cut. */
export function sourceToOutput(t: number, kept: Range[]): number {
  let output = 0;
  for (const r of kept) {
    if (t <= r.start) return output;
    if (t < r.end) return output + t - r.start;
    output += r.end - r.start;
  }
  return output;
}

/** Map a compact timeline position back to its source clock. */
export function outputToSource(t: number, kept: Range[]): number {
  let output = 0;
  for (const r of kept) {
    const length = r.end - r.start;
    if (t < output + length) return r.start + Math.max(0, t - output);
    output += length;
  }
  return kept.at(-1)?.end ?? 0;
}

const covers = (item: TrackItem, t: number) => t >= item.start && t < item.start + item.duration;

/** Playback rate from Speed Control effects ("0.5×", "2×" labels or item.speed). */
export function speedAt(t: number, effects: TrackItem[]): number {
  const item = effects.find(e => e.category === 'Speed Control' && covers(e, t));
  if (!item) return 1;
  return item.speed ?? (parseFloat(item.label) || 1);
}

/** Zoom factor for the gameplay crop: eases to item.zoom (default 1.5) in/out over 0.4 s. */
export function zoomAt(t: number, effects: TrackItem[]): { factor: number; focus: { x: number; y: number } } {
  const item = effects.find(e => e.category === 'Zoom' && covers(e, t));
  if (!item) return { factor: 1, focus: { x: .5, y: .5 } };
  const ramp = .4, local = t - item.start, left = item.duration - local;
  const k = Math.min(1, local / ramp, left / ramp);
  const eased = k * k * (3 - 2 * k);
  return { factor: 1 + ((item.zoom ?? 1.5) - 1) * eased, focus: item.focus ?? { x: .5, y: .5 } };
}

export const activeAt = (items: TrackItem[], t: number) => items.filter(item => covers(item, t));
