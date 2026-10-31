import { stickers } from '../../social-stickers/registry';
import { StickerView } from '../../social-stickers/StickerView';
import type { StickerEntry } from '../../social-stickers/types';
import { useEditor } from '../../../../state';
import { platformsOf } from '../brand-pick-design';

// Variant soc-design-strip: six "Looks" for the brand's platforms (2 static, 2 animated, 2 multi-platform) inside the brand card.
const shows = (s: StickerEntry) => s.platforms.filter(p => p !== 'Generic').map(p => p.toLowerCase());
export function lookStrip(design: string): StickerEntry[] {
  const want = platformsOf(design).map(p => p.toLowerCase()), match = stickers.filter(s => !want.length || want.some(w => shows(s).includes(w)));
  const out: StickerEntry[] = [], add = (list: StickerEntry[], n: number) => list.filter(s => !out.includes(s)).slice(0, n).forEach(s => out.push(s));
  add(match.filter(s => !s.animated && shows(s).length < 2), 2); add(match.filter(s => s.animated), 2); add(match.filter(s => shows(s).length > 1), 2);
  add(stickers, 6 - out.length);
  return out.slice(0, 6);
}
export function BrandDesignStrip({ handle, design, pick }: { handle: string; design: string; pick: (s: StickerEntry) => void }) {
  const { actions } = useEditor();
  return <div className="brand-looks"><span className="brand-variant-title">Looks</span>
    <div className="brand-looks-row">{lookStrip(design).map(s => <button key={s.id} type="button" title={s.look} className={'elements-tile sl-tile' + (s.id === design ? ' selected' : '')} onClick={() => pick(s)}><StickerView id={s.id} name={handle} /></button>)}</div>
    <button type="button" className="brand-looks-more" onClick={() => { actions.chooseTab('Elements'); actions.pushPage({ type: 'gallery', title: 'Social Stickers', category: 'Social Stickers' }); }}>More looks →</button></div>;
}
