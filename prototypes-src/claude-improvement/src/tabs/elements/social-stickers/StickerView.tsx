import type { CSSProperties } from 'react';
import { findSticker, renderFor } from './registry';
import { PlatformIcon } from '../PlatformIcon';
import './stickers-base.css';

/** One social sticker design with the given handle. `size` = px per em (10 in gallery tiles); preview passes a cqw size. */
export function StickerView({ id, name, size, still = false }: { id: string; name: string; size?: string; still?: boolean }) {
  const entry = findSticker(id), render = renderFor(id);
  const style = { fontSize: size || '8px' } as CSSProperties; // 8px per em fits the live tile scale
  return <span className={`sl-sticker${entry?.animated && !still ? ' is-animated' : ''}`} data-sticker={id} style={style}>
    {render ? render(name || ' ') : <span className="sl-fallback"><PlatformIcon platform={entry?.platforms[0] || 'Twitch'} /><b>{name}</b></span>}
  </span>;
}
