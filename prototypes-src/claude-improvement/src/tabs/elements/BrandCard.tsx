import { useEditor } from '../../state';
import { brandStickerItem, isBrandSticker } from '../../shell/brand-sticker';
import { findSticker } from './social-stickers/registry';
import { StickerView } from './social-stickers/StickerView';
import { setStickerHandle } from './social-stickers/handle';
import { hasVariant } from '../../variant';
import { useBrandDesign } from './variants/social/use-brand-design';
import { BrandDesignStrip } from './variants/social/BrandDesignStrip';
import './variants/social/social-variants.css';
import { BrandPlatformChips } from './variants/brand-platform-chips';
import { BrandMultiRow } from './variants/brand-multi-row';

// Claude improvement C8: the brand sticker sits at the top of Elements as a saved setting. The handle and the
// last picked design are remembered; "every new clip" is on by default (set once, never re-add per clip).
export function BrandCard() {
  const { state, actions } = useEditor();
  const { brand, update, onClip, pickDesign } = useBrandDesign();
  const socials = hasVariant('soc-words') || hasVariant('soc-v2');
  function rename(handle: string) {
    update({ handle }); setStickerHandle(handle);
    state.elements.filter(isBrandSticker).forEach(x => actions.updateItem(x.id, { label: handle }));
  }
  function addToClip() { const { id: _id, ...item } = brandStickerItem(state.duration, brand); actions.addItem(item); }
  return <section className="brand-card">
    <div className="brand-card-head"><strong>{socials ? 'Your socials sticker' : 'Your brand sticker'}</strong><small>{onClip ? 'On this clip · 0:00 to the end' : 'Not on this clip'}</small></div>
    <div className="brand-card-row">
      <div className="brand-card-preview">{findSticker(brand.design) && <StickerView id={brand.design} name={brand.handle} />}</div>
      <label className="brand-card-handle">Handle<input value={brand.handle} onChange={e => rename(e.target.value)} /></label>
    </div>
    <label className="brand-card-auto"><input type="checkbox" checked={brand.auto} onChange={e => update({ auto: e.target.checked })} /> Add to every new clip</label>
    {hasVariant('brand-platforms') && <BrandPlatformChips design={brand.design} pick={pickDesign} />}
    {hasVariant('soc-design-strip') && <BrandDesignStrip handle={brand.handle} design={brand.design} pick={pickDesign} />}
    {!onClip && <button className="brand-card-add" onClick={addToClip}>Add to this clip</button>}
    <p className="brand-card-note">{socials ? 'Pick any design below to use it on your clips.' : 'Pick any sticker below to make it your brand design.'}</p>
    {hasVariant('brand-multi-row') && <BrandMultiRow handle={brand.handle} design={brand.design} pick={pickDesign} />}
  </section>;
}
