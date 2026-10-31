import { catalog } from './catalog';
import type { StickerEntry, StickerRender } from './types';
import { renders as animated } from './designs-animated';
import { renders as twitchMultiple } from './designs-twitch-multiple';
import { renders as youtubeKickFacebook } from './designs-youtube-kick-facebook';

const renders: Record<string, StickerRender> = { ...animated, ...twitchMultiple, ...youtubeKickFacebook };
export const stickers: StickerEntry[] = catalog;
export const stickerSections = ['Animated', 'Multiple', 'Twitch', 'Youtube', 'Kick', 'Facebook'] as const;
export const stickerTabs = ['All', ...stickerSections] as const;

export function renderFor(id: string): StickerRender | undefined { return renders[id]; }
export function findSticker(id?: string) { return stickers.find(s => s.id === id); }

/** Tab filter: platform tabs include every design that shows that platform, like the live editor. */
export function inTab(s: StickerEntry, tab: string) {
  if (tab === 'All') return true;
  if (tab === 'Animated') return s.animated;
  if (tab === 'Multiple') return s.platforms.filter(p => p !== 'Generic').length > 1;
  return s.platforms.includes(tab);
}
