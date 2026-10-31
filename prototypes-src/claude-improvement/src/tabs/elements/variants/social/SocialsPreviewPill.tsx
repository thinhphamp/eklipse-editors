import { useEditor } from '../../../../state';
import { brandStickerItem, isBrandSticker } from '../../../../shell/brand-sticker';
import { hasVariant } from '../../../../variant';

// Variant soc-preview-entry: pill under the brand sticker on the preview, or a dashed "+ Add your socials" spot when none is on the clip.
export function SocialsPreviewPill() {
  const { state, actions } = useEditor(), item = state.elements.find(isBrandSticker);
  if (state.activeTab === 'Export' || item && state.selectedElementId === item.id) return null; // selected: handles and toolbar sit here
  const socV2 = hasVariant('soc-v2');
  const open = (id?: string) => {
    actions.chooseTab('Elements');
    if (socV2) { actions.patch({ selectedElementId: id || item?.id }); return; }
    actions.pushPage({ type: 'gallery', title: 'Social Stickers', category: 'Social Stickers' });
  };
  if (!item) {
    const p = brandStickerItem(state.duration).preview!;
    return <button className="soc-add-spot" style={{ left: p.x + '%', top: p.y + '%', width: p.width + '%', height: p.height + '%' }} onPointerDown={e => e.stopPropagation()}
      onClick={() => { const { id: _id, ...it } = brandStickerItem(state.duration); const id = actions.addItem(it); open(id); }}>+ Add your socials</button>;
  }
  // Shown at the sticker's spot even when the playhead is outside its time, so the entry is always there.
  const p = item.preview || { x: 30, y: 14, width: 42, height: 7, opacity: 100 }; // PreviewElements' default for Social Stickers
  return <button className="soc-edit-pill" aria-label="Edit socials" style={{ left: p.x + p.width / 2 + '%', top: `calc(${p.y + p.height}% + 4px)` }} onPointerDown={e => e.stopPropagation()} onClick={() => open(item.id)}>✎ Edit socials</button>;
}
