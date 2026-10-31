import { useEffect, useState } from 'react';
import { useEditor } from '../../state';
import { MockBadge } from '../../ui/MockBadge';
import { CaptionWords } from '../../shell/preview-caption/CaptionWords';
import { captionMotion, captionStyle } from './render-style';
import { StyleFields, type StyleSetter } from './StyleFields';
import { AnimationGrid, StyleConfigure } from './StyleConfigure';
import { SpeakerEditor } from './SpeakerEditor';
import type { CaptionDocument } from './model';
const tabs = ['Style', 'Effect', 'Configure', 'Speakers'];
export function StyleEditor({ tab, setTab, onClose, onSave, browse, doc, update, settings, setEffect, busy, name, setName }: {
  tab: string; setTab: (tab: string) => void; onClose: () => void; onSave: () => void; browse: () => void;
  doc: CaptionDocument; update: (doc: CaptionDocument, label: string) => void; settings: Record<string, boolean>;
  setEffect: (name: string, value: boolean) => void; busy: string; name: string; setName: (name: string) => void;
}) {
  const { actions } = useEditor(); const [sampleTime, setSampleTime] = useState(0);
  const set: StyleSetter = (key, value) => update({ ...doc, style: { ...doc.style, ...(key === 'animation' && value === 'Accessible short captions' ? { maxChars: 20, singleWord: false, breakLines: true } : {}), [key]: value } }, `Change caption ${key}`);
  useEffect(() => { const start = performance.now(); const id = window.setInterval(() => setSampleTime(((performance.now() - start) % 2500) / 1000), 40); return () => window.clearInterval(id); }, []);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [onClose]);
  const sampleWords = doc.words.slice(7, 11).map((word, index) => ({ ...word, startMs: index * 450, endMs: (index + 1) * 450 }));
  return <div className="captions-modal-backdrop" onClick={onClose}><div className="captions-modal" role="dialog" aria-modal="true" aria-label="Edit caption style" onClick={event => event.stopPropagation()}>
    <header><b>Edit caption style</b><span>/</span><span>{doc.style.presetFlavor === 'hook' ? 'Comic' : doc.style.presetFlavor === 'blue' ? 'Floating Words' : 'Custom style'}</span><button onClick={onClose} aria-label="Close">×</button></header>
    <div className="captions-modal-body"><div className="captions-modal-left"><div className="captions-modal-tabs" role="tablist">{tabs.map((item, index) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => { if (tab === item) actions.notify(`${item} is already open`); setTab(item); }}>{['T ', '✧ ', '☷ ', '♧ '][index]}{item}</button>)}</div>
      <div className="captions-modal-scroll">
        {tab === 'Style' && <><div className="captions-style-current"><span aria-hidden="true">AA</span><span><b>{String(doc.style.animation || 'No animation')}</b><small>Text style</small></span><i aria-hidden="true">✓</i></div><StyleFields style={doc.style} set={set} /><div className="captions-or">OR</div><button className="captions-select-style" onClick={browse}><span>♧</span><b>Select an existing style</b><small>Browse your saved styles and ready-made looks.</small></button></>}
        {tab === 'Effect' && <><h3>Choose a caption effect</h3><p>Choose how the words appear, then fine-tune them in Configure.</p><AnimationGrid style={doc.style} set={set} /></>}
        {tab === 'Configure' && <StyleConfigure style={doc.style} set={set} settings={settings} setEffect={setEffect} />}
        {tab === 'Speakers' && <SpeakerEditor doc={doc} update={update} settings={settings} setEffect={setEffect} />}
        {['Configure', 'Speakers'].includes(tab) && <><MockBadge />{busy && <p role="status">Preparing {busy}…</p>}</>}
      </div></div><div className="captions-modal-right"><div className="captions-checker" data-effect={String(doc.style.animation)}>
        <div className="captions-modal-sample" style={{ ...captionStyle(doc.style), transform: 'none', ...(doc.style.animationTarget === 'Sentence animations' ? captionMotion(String(doc.style.animation), sampleTime * 1000) : {}) }}>
          <CaptionWords group={sampleWords} doc={doc} settings={settings} time={sampleTime} />
        </div>
      </div><div className="captions-color-dots">{['var(--text-1)', 'var(--art-ffff81)', 'var(--accent)', 'var(--art-fa90df)'].map((color, index) => <button key={color} aria-label={`Preset color ${index + 1}`} className={doc.style.fill === color ? 'active' : ''} style={{ background: color }} onClick={() => { if (doc.style.fill === color) actions.notify('This fill color is already selected'); set('fill', color); }} />)}</div></div>
    </div><footer><button className="captions-primary" onClick={onSave}>Save style</button></footer>
  </div></div>;
}
