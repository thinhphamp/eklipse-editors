import { useState } from 'react';
import { BrandCard } from '../../BrandCard';
import { SocialGallery } from '../../social-stickers/SocialGallery';
import { useBrandDesign } from './use-brand-design';

// Variants soc-rail-tab / soc-preview-entry: brand card on top, full design gallery below; a tile restyles the brand sticker.
export function BrandGallery() {
  const [filter, setFilter] = useState('All'), { pickOrAdd } = useBrandDesign();
  return <><BrandCard /><SocialGallery filter={filter} setFilter={setFilter} onPick={pickOrAdd} /></>;
}
