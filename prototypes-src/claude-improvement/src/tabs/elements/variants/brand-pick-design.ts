import { stickers } from '../social-stickers/registry';
import type { StickerEntry } from '../social-stickers/types';

// Probe variants for the brand card: which multi-platform designs exist, and which design best shows a set of platforms.
export const brandPlatforms = ['Twitch', 'YouTube', 'Kick', 'TikTok', 'Instagram'];
const shows = (s: StickerEntry) => s.platforms.filter(p => p !== 'Generic').map(p => p.toLowerCase());
export const platformsOf = (id: string) => brandPlatforms.filter(p => shows(stickers.find(s => s.id === id) ?? { platforms: [] } as unknown as StickerEntry).includes(p.toLowerCase()));
export const multiPlatformDesigns = () => stickers.filter(s => shows(s).length > 1);

/** Best design that shows every wanted platform: the current one if it fits, else fewest extra platforms (still images first). */
export function bestDesign(wanted: string[], currentId: string): StickerEntry | undefined {
  const want = wanted.map(w => w.toLowerCase()), fits = (s: StickerEntry) => want.every(w => shows(s).includes(w));
  const current = stickers.find(s => s.id === currentId);
  if (current && fits(current)) return current;
  return stickers.filter(fits).sort((a, b) => shows(a).length - shows(b).length || Number(a.animated) - Number(b.animated))[0];
}
