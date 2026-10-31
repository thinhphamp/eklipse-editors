import type { EditorState, TrackItem } from '../state';
import { hasVariant } from '../variant';
import { isChannelSticker, newClipStickers } from '../tabs/channel/channel-set';

// Claude improvement C8: the social sticker is the streamer's brand on every clip, so it is a saved setting,
// not a per-clip decoration. Set it once; every new clip and every style starts with it, for the whole clip.
export type BrandSticker = { handle: string; design: string; platform: string; auto: boolean };
const key = 'ek-claude-brand';
const fallback: BrandSticker = { handle: 'thinhsocial', design: 'sl-stw01', platform: 'Twitch', auto: true };

export function loadBrand(): BrandSticker {
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return fallback; }
}
export function saveBrand(change: Partial<BrandSticker>) {
  try { localStorage.setItem(key, JSON.stringify({ ...loadBrand(), ...change })); } catch { /* private mode */ }
}

export const isBrandSticker = (item: TrackItem) => item.category === 'Social Stickers';
export const hasBrandSticker = (state: Pick<EditorState, 'elements'>) => state.elements.some(isBrandSticker);

/** Below the facecam and above the captions (y 75) and the platform UI, from 0 s to the end of the clip. */
export function brandStickerItem(duration: number, brand = loadBrand()): TrackItem {
  if (hasVariant('ch-stickers')) { const [first] = newClipStickers(duration); if (first) return first; }
  return { id: 'brand-sticker', label: brand.handle, kind: 'element', category: 'Social Stickers', start: 0, duration,
    preview: { x: 30, y: 60, width: 41, height: 7, opacity: 100 },
    style: { design: brand.design, platform: brand.platform, inIntensity: 50, inSpeed: 75, outIntensity: 50, outSpeed: 75, letterAnimation: 'None', visualEffect: 'None' } };
}

/** Elements with the brand sticker added when it is missing. */
export function withBrandSticker(state: Pick<EditorState, 'elements'|'duration'>): TrackItem[] {
  // ch-stickers: the remembered set (Channel stickers tab, "Use these stickers on every new clip").
  if (hasVariant('ch-stickers')) {
    // Old single brand stickers (design ids) give way to the channel sticker set.
    const rest = state.elements.filter(x => !isBrandSticker(x) || isChannelSticker(x));
    return rest.some(isChannelSticker) ? rest : [...newClipStickers(state.duration), ...rest];
  }
  return hasBrandSticker(state) ? state.elements : [brandStickerItem(state.duration), ...state.elements];
}
