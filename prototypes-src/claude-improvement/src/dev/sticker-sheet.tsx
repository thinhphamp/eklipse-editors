// Comparison sheet (published next to the prototype): live StreamLadder capture next to the prototype design.
// Open sticker-sheet.html?only=<id prefix>&name=<handle>&still=1
import { createRoot } from 'react-dom/client';
import '../theme/tokens.css';
import { stickers } from '../tabs/elements/social-stickers/registry';
import { StickerView } from '../tabs/elements/social-stickers/StickerView';

const REF = './sticker-refs/'; // copies of the live StreamLadder capture (public/sticker-refs)
const q = new URLSearchParams(location.search), only = q.get('only') || '', name = q.get('name') || 'thinhsocial', still = q.has('still');
const list = stickers.filter(s => s.id.startsWith(only));
function Sheet() {
  return <div className="sheet">{list.map(s => <div key={s.id} className="row" data-id={s.id}>
    <code>{s.id}</code>
    <div className="cell ref"><img src={`${REF}${s.id.replace('sl-', 'elem-03.')}.${s.animated && !still ? 'gif' : 'png'}`} alt="" /></div>
    <div className="cell ours sl-tile"><StickerView id={s.id} name={name} still={still} /></div>
    <small>{s.look}{s.motion ? ' | ' + s.motion : ''}</small></div>)}</div>;
}
const css = `.sheet{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:8px;font:12px system-ui;background:var(--art-ffffff)}
.row{display:grid;grid-template-columns:110px 160px 160px 1fr;gap:6px;align-items:center;border:1px solid var(--art-dddddd);padding:4px}
.cell{height:84px;display:flex;align-items:center;justify-content:center;background:var(--art-ffffff);outline:1px dashed var(--art-dddddd);overflow:hidden}.cell img{max-width:100%;max-height:100%}`;
const st = document.createElement('style'); st.textContent = css; document.head.append(st);
createRoot(document.getElementById('root')!).render(<Sheet />);
