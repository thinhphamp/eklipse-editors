import type { StickerEntry } from './types';
import { inTab, stickerSections, stickerTabs, stickers } from './registry';
import { setStickerHandle, useStickerHandle } from './handle';
import { StickerView } from './StickerView';

export function SocialStickerTile({ s, onPick }: { s: StickerEntry; onPick: (s: StickerEntry, name: string) => void }) {
  const name = useStickerHandle();
  return <button className="elements-tile sl-tile" title={s.look} onClick={() => onPick(s, name)}>
    <StickerView id={s.id} name={name} />
  </button>;
}

/** View all > Social Stickers: tabs, live handle input, grid grouped by section (All) or filtered (other tabs). */
export function SocialGallery({ filter, setFilter, onPick, hideName = false }: { filter: string; setFilter: (f: string) => void; onPick: (s: StickerEntry, name: string) => void; hideName?: boolean }) {
  const name = useStickerHandle();
  const groups = filter === 'All' ? stickerSections.map(sec => [sec, stickers.filter(s => s.section === sec)] as const)
    : [[filter, stickers.filter(s => inTab(s, filter))] as const];
  return <>
    <div className="elements-pills">{stickerTabs.map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>
    {!hideName && <input className="elements-search" aria-label="Sticker text" value={name} onChange={e => setStickerHandle(e.target.value)} />}
    {groups.map(([title, list]) => <div key={title}><h3>{title}</h3>
      <div className="elements-grid">{list.map(s => <SocialStickerTile key={s.id} s={s} onPick={onPick} />)}</div></div>)}
  </>;
}
