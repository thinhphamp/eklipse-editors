import { useSyncExternalStore } from 'react';
import type { TrackItem } from '../../state/types';

// ch-stickers: a clip carries up to 3 channel stickers. Each sticker = one name + its platform icon(s), a look, a tint and
// a time range. The set, the last name and the last platform are remembered (local storage) for the next clips.

export const MAX_STICKERS = 3;
export type Timing = 'whole'|'start'|'end'|'custom';
export type ChannelSticker = { look: string; plats: string[]; color: string; name: string; timing: Timing; from?: number; to?: number; y?: number };
type Saved = { keep: boolean; lastName: string; lastPlat: string; set: ChannelSticker[] };

const key = 'ek-channel-stickers';
const fallback: Saved = { keep: true, lastName: 'thinhsocial', lastPlat: 'twitch', set: [] };
export function loadChannel(): Saved {
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return fallback; }
}
export function saveChannel(change: Partial<Saved>) {
  try { localStorage.setItem(key, JSON.stringify({ ...loadChannel(), ...change })); } catch { /* private mode */ }
}

export const timingLabel: Record<Timing, string> = { whole: 'Whole clip', start: 'First 5 s', end: 'Last 5 s', custom: 'Custom' };
/** Start and end (s) of a timing on a clip of `duration` seconds. */
export function span(timing: Timing, duration: number, from = 0, to = duration): [number, number] {
  if (timing === 'start') return [0, Math.min(5, duration)];
  if (timing === 'end') return [Math.max(0, duration - 5), duration];
  if (timing === 'custom') return [from, to];
  return [0, duration];
}
/** Timing of a sticker on the timeline; a preset that no longer matches (trimmed on the timeline) reads as Custom. */
export function timingOf(item: TrackItem, duration: number): Timing {
  const t = String(item.style?.timing || 'whole') as Timing;
  if (t === 'custom') return t;
  const [a, b] = span(t, duration), near = (x: number, y: number) => Math.abs(x - y) < .05;
  return near(item.start, a) && near(item.start + item.duration, b) ? t : 'custom';
}

export const isChannelSticker = (item: TrackItem) => item.category === 'Social Stickers' && Boolean(item.style?.look);
export const platsOf = (item: TrackItem) => String(item.style?.plats || 'twitch').split(',').filter(Boolean);
export const toSticker = (item: TrackItem, duration: number): ChannelSticker => {
  const timing = timingOf(item, duration);
  return { look: String(item.style?.look), plats: platsOf(item), color: String(item.style?.color || 'original'), name: item.label, timing,
    ...(timing === 'custom' ? { from: item.start, to: item.start + item.duration } : {}), y: item.preview?.y };
};

/** Default slot: under the facecam, above the captions; stickers shown at the same time stack upwards. */
export const slotY = (index: number) => 60 - index * 8;
export function stickerItem(s: ChannelSticker, duration: number, index = 0): Omit<TrackItem, 'id'> {
  const [start, end] = span(s.timing, duration, s.from, s.to);
  // Looks carry their own motion, so no extra entry/exit fade (it would hide the sticker at its first frame).
  return { label: s.name, kind: 'element', category: 'Social Stickers', start, duration: Math.max(.5, end - start), animationIn: 'None', animationOut: 'None',
    preview: { x: 30, y: s.y ?? slotY(index), width: 41, height: 7, opacity: 100 },
    style: { look: s.look, plats: s.plats.join(','), color: s.color, timing: s.timing, inIntensity: 50, inSpeed: 75, outIntensity: 50, outSpeed: 75, letterAnimation: 'None', visualEffect: 'None' } };
}

/** Stickers a new clip starts with: the remembered set, or one default sticker. */
export function newClipStickers(duration: number): TrackItem[] {
  const saved = loadChannel();
  if (!saved.keep) return [];
  const set = saved.set.length ? saved.set : [{ look: 'block', plats: [saved.lastPlat], color: 'original', name: saved.lastName, timing: 'whole' as Timing }];
  return set.slice(0, MAX_STICKERS).map((s, i) => ({ id: 'channel-sticker-' + i, ...stickerItem(s, duration, i) }));
}

// Look hovered in the panel: drawn as a preview on the video until the pointer leaves.
export type Ghost = { look: string; plats: string[]; color: string; name: string } | null;
let ghost: Ghost = null;
const listeners = new Set<() => void>();
export function setGhost(next: Ghost) { if (JSON.stringify(next) === JSON.stringify(ghost)) return; ghost = next; listeners.forEach(fn => fn()); }
export const useGhost = () => useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn); }, () => ghost);
