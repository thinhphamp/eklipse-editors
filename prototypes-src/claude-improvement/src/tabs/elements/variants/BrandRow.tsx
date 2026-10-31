import { useState } from 'react';
import { useEditor } from '../../../state';
import { isBrandSticker, loadBrand } from '../../../shell/brand-sticker';
import { BrandCard } from '../BrandCard';
import './variants.css';

// Variant el-media-first: once the brand sticker is on the clip, Elements shows one line instead of the full card.
export function BrandRow() {
  const {state} = useEditor(), [open, setOpen] = useState(false);
  if (!state.elements.some(isBrandSticker) || open) return <BrandCard/>;
  return <div className="brand-row"><span>@{loadBrand().handle} · on this clip</span><button onClick={() => setOpen(true)}>Edit</button></div>;
}
