import { useEffect, useState } from 'react';
import { useEditor } from '../../../../state';
import { brandStickerItem, isBrandSticker, loadBrand, saveBrand, type BrandSticker } from '../../../../shell/brand-sticker';
import { usePremium } from '../../../../ui/premium';
import type { StickerEntry } from '../../social-stickers/types';

// Shared brand state + pickDesign for BrandCard and the soc-* variants (soc-rail-tab, soc-preview-entry, soc-words, soc-design-strip).
const bus = new EventTarget();
export function useBrandDesign() {
  const { state, actions } = useEditor(), premium = usePremium();
  const [brand, setBrand] = useState(loadBrand), onClip = state.elements.find(isBrandSticker);
  useEffect(() => { const f = (e: Event) => setBrand(b => ({ ...b, ...(e as CustomEvent).detail })); bus.addEventListener('brand', f); return () => bus.removeEventListener('brand', f); }, []);
  const update = (change: Partial<BrandSticker>) => { saveBrand(change); bus.dispatchEvent(new CustomEvent('brand', { detail: change })); };
  // Same effect as picking a tile in the gallery: save the brand design and restyle the sticker on this clip.
  function pickDesign(st: StickerEntry) {
    if (st.animated && !premium.require('animated-social-stickers')) return;
    const design = { design: st.id, platform: st.platforms[0] };
    update(design); state.elements.filter(isBrandSticker).forEach(x => actions.updateItem(x.id, { style: { ...x.style, ...design } }));
  }
  // Gallery tile in the soc-* variants: restyle the brand sticker; add one first when the clip has none.
  function pickOrAdd(st: StickerEntry) {
    if (onClip) return pickDesign(st);
    if (st.animated && !premium.require('animated-social-stickers')) return;
    const design = { design: st.id, platform: st.platforms[0] };
    update(design); const { id: _id, ...item } = brandStickerItem(state.duration, { ...brand, ...design }); actions.addItem(item);
  }
  return { brand, update, onClip, pickDesign, pickOrAdd };
}
