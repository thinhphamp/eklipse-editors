import type { ReactNode } from 'react';

export type StickerSection = 'Animated' | 'Multiple' | 'Twitch' | 'Youtube' | 'Kick' | 'Facebook';

/** One StreamLadder social sticker as captured live (catalog.ts). */
export interface StickerEntry {
  id: string; section: StickerSection; index: number; platforms: string[];
  animated: boolean; text: string; look: string; motion: string;
}

/** Draws one design. `name` is the live handle; size everything in em (1em = 8px in a gallery tile). */
export type StickerRender = (name: string) => ReactNode;
