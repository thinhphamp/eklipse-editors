import { useState } from 'react';
import { bestDesign, brandPlatforms, platformsOf } from './brand-pick-design';
import type { StickerEntry } from '../social-stickers/types';
import './brand-variants.css';

// Variant brand-platforms: toggle the platforms the sticker should show; the best matching design becomes the brand design.
export function BrandPlatformChips({ design, pick }: { design: string; pick: (s: StickerEntry) => void }) {
  const [sel, setSel] = useState(() => platformsOf(design)), [miss, setMiss] = useState(false);
  function toggle(p: string) {
    const next = sel.includes(p) ? sel.filter(x => x !== p) : [...sel, p];
    setSel(next);
    if (!next.length) { setMiss(false); return; }
    const found = bestDesign(next, design);
    setMiss(!found);
    if (found && found.id !== design) pick(found);
  }
  return <div className="brand-platforms">
    <span className="brand-variant-title">Platforms on your sticker</span>
    <div className="brand-platform-chips">{brandPlatforms.map(p => <button key={p} type="button" aria-pressed={sel.includes(p)} className={sel.includes(p) ? 'on' : ''} onClick={() => toggle(p)}>{p}</button>)}</div>
    {miss && <small className="brand-variant-miss">No sticker shows that mix yet. Keeping your current design.</small>}
  </div>;
}
