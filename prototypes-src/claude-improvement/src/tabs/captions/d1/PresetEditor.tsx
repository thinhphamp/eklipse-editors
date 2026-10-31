import { useEffect, useState } from 'react';
import { CaptionWords } from '../../../shell/preview-caption/CaptionWords';
import { captionStyle } from '../render-style';
import type { CaptionDocument, CaptionStyle } from '../model';

const fonts: [string, string][] = [['CaptionBangers', 'Bangers'], ['CaptionAnton', 'Anton'], ['CaptionBebas', 'Bebas Neue'], ['CaptionLuckiest', 'Luckiest Guy'], ['CaptionMontserrat', 'Montserrat'], ['CaptionPoppins', 'Poppins']];
const fills: [string, string][] = [['White', 'var(--art-ffffff)'], ['Yellow', 'var(--art-ffff81)'], ['Pink', 'var(--art-fa90df)'], ['Green', 'var(--art-b3ff42)'], ['Cyan', 'var(--art-b5f7ff)'], ['Purple', 'var(--art-ab60fa)'], ['Red', 'var(--art-ff9a9a)'], ['Black', 'var(--art-151515)']];
const strokes: [string, string][] = [['Black', 'var(--art-151515)'], ['White', 'var(--art-ffffff)'], ['Purple', 'var(--art-6c6bff)']];
const highlights: [string, string][] = [['Yellow', 'var(--art-ffff81)'], ['Pink', 'var(--art-fa90df)'], ['Green', 'var(--art-b3ff42)'], ['Cyan', 'var(--art-b5f7ff)'], ['Purple', 'var(--art-ab60fa)'], ['White', 'var(--art-ffffff)']];

/** Popup: edit the preset of style (font, weight, colours, stroke, highlight) with a live preview. */
export function PresetEditor({ doc, name, mine, settings, onApply, onSave, onClose }: {
  doc: CaptionDocument; name: string; mine: boolean; settings: Record<string, boolean>;
  onApply: (style: CaptionStyle) => void; onSave: (style: CaptionStyle) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<CaptionStyle>(doc.style); const [t, setT] = useState(0);
  const set = (key: string, value: string | number | boolean) => setDraft(d => ({ ...d, [key]: value }));
  useEffect(() => { const start = performance.now(); const id = window.setInterval(() => setT(((performance.now() - start) % 2700) / 1000), 40); return () => window.clearInterval(id); }, []);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [onClose]);
  // Sample: four words of the transcript, re-timed to loop; Word by word shows one at a time.
  const sample = doc.words.slice(7, 11).map((word, i) => ({ ...word, startMs: i * 600, endMs: (i + 1) * 600 }));
  const shown = draft.singleWord ? sample.filter(w => t * 1000 >= w.startMs && t * 1000 < w.endMs) : sample;
  const swatches = (key: string, list: [string, string][], none?: boolean) => <div className="cap-d1-swatches">
    {none && <button className="none" aria-label={`No ${key}`} aria-pressed={Number(draft.strokeWidth ?? 2) === 0} onClick={() => set('strokeWidth', 0)}>∅</button>}
    {list.map(([label, value]) => <button key={value} aria-label={`${key} ${label}`} aria-pressed={draft[key] === value && !(none && Number(draft.strokeWidth ?? 2) === 0)} style={{ background: value }}
      onClick={() => setDraft(d => ({ ...d, [key]: value, ...(none && Number(d.strokeWidth ?? 2) === 0 ? { strokeWidth: 2 } : {}) }))} />)}
  </div>;
  const toggle = (label: string, on: boolean, flip: () => void, style?: React.CSSProperties) => <button className="cap-d1-tog" aria-pressed={on} style={style} onClick={flip}>{label}</button>;
  return <div className="captions-modal-backdrop" onClick={onClose}><section className="cap-d1-modal" role="dialog" aria-modal="true" aria-label="Edit preset of style" onClick={event => event.stopPropagation()}>
    <header><b>Edit preset of style</b><span>/</span><span>{mine ? name : `${name} · built-in`}</span><button onClick={onClose} aria-label="Close">×</button></header>
    <div className="cap-d1-modal-body">
      <div className="cap-d1-modal-left">
        <p className="cap-d1-note">{mine ? 'Changes save to your preset of style.' : 'Built-in presets of style stay as they are; saving makes your own copy.'}</p>
        <div className="cap-d1-rows"><h4>Typography</h4>
          <div className="cap-d1-row"><span>Font</span><div><select aria-label="Caption font" value={String(draft.font)} style={{ fontFamily: String(draft.font) }} onChange={event => set('font', event.target.value)}>{fonts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
          <div className="cap-d1-row"><span>Style</span><div>{toggle('Bold', Number(draft.weight ?? 800) >= 700, () => set('weight', Number(draft.weight ?? 800) >= 700 ? 400 : 800))}{toggle('Italic', !!draft.italic, () => set('italic', !draft.italic), { fontStyle: 'italic' })}{toggle('AA', !!draft.uppercase, () => set('uppercase', !draft.uppercase))}</div></div>
          <div className="cap-d1-row"><span>Size</span><div><input type="range" aria-label="Caption size" min="24" max="80" value={Number(draft.size ?? 48)} onChange={event => set('size', +event.target.value)} /><output>{Number(draft.size ?? 48)}</output></div></div>
        </div>
        <div className="cap-d1-rows"><h4>Colours</h4>
          <div className="cap-d1-row"><span>Fill</span><div>{swatches('fill', fills)}</div></div>
          <div className="cap-d1-row"><span>Stroke</span><div>{swatches('stroke', strokes, true)}<input type="range" aria-label="Stroke width" min="0" max="6" value={Number(draft.strokeWidth ?? 2)} onChange={event => set('strokeWidth', +event.target.value)} /></div></div>
        </div>
        <div className="cap-d1-rows"><h4>Highlight spoken word</h4>
          <div className="cap-d1-row"><span>Type</span><div className="cap-d1-seg">{['None', 'Color', 'Underline', 'Pill'].map(item => <button key={item} aria-pressed={draft.highlight === item} onClick={() => set('highlight', item)}>{item}</button>)}</div></div>
          {draft.highlight !== 'None' && <div className="cap-d1-row"><span>Colour</span><div>{swatches('highlightColor', highlights)}</div></div>}
        </div>
      </div>
      <div className="cap-d1-modal-right"><div className="cap-d1-stage" style={{ backgroundImage: 'url(media/demo-poster.jpg)' }}>
        <div className="cap-d1-stage-caption" style={{ ...captionStyle(draft), fontSize: `${Math.round(Number(draft.size ?? 48) * .75)}px` }}><CaptionWords group={shown} doc={{ ...doc, style: draft }} settings={settings} time={t} /></div>
      </div><small>Live preview with this preset of style</small></div>
    </div>
    <footer><button onClick={onClose}>Cancel</button><span /><button onClick={() => onApply(draft)}>Apply to this clip</button><button className="captions-primary" onClick={() => onSave(draft)}>{mine ? 'Save my preset of style' : 'Save as my preset of style'}</button></footer>
  </section></div>;
}
