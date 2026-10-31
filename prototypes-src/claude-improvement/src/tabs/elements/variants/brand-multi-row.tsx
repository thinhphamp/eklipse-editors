import { multiPlatformDesigns } from './brand-pick-design';
import { StickerView } from '../social-stickers/StickerView';
import type { StickerEntry } from '../social-stickers/types';
import './brand-variants.css';

// Variant brand-multi-row: multi-platform designs one tap away, without opening "View all".
export function BrandMultiRow({ handle, design, pick }: { handle: string; design: string; pick: (s: StickerEntry) => void }) {
  return <div className="brand-multi">
    <span className="brand-variant-title">Show more than one platform</span>
    <div className="brand-multi-grid">{multiPlatformDesigns().map(s => <button key={s.id} type="button" title={s.platforms.join(' + ')} className={'brand-multi-tile' + (s.id === design ? ' on' : '')} onClick={() => pick(s)}><span><StickerView id={s.id} name={handle} /></span><small>{s.platforms.join(' + ')}</small></button>)}</div>
  </div>;
}
