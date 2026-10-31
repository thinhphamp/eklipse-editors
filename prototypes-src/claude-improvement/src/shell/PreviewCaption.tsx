import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor } from '../state';
import { usePlaybackTime } from '../engine/use-playback';
import { aiMocks } from '../fixtures';
import { captionGroups, initialWords, readCaption, writeCaption } from '../tabs/captions/model';
import { captionMotion, captionStyle } from '../tabs/captions/render-style';
import { CaptionWords } from './preview-caption/CaptionWords';
import { hasVariant } from '../variant';
import '../tabs/captions/caption-fonts.css';
import './preview-caption/PreviewCaption.css';
export function PreviewCaption() {
  const { state, actions } = useEditor(); const time = usePlaybackTime(); const { captions } = state;
  const [selected, setSelected] = useState(false); const [draft, setDraft] = useState<{ y: number; width: number } | null>(null);
  const doc = useMemo(() => readCaption(captions), [captions.text, captions.preset]); const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; top: number; width: number; resize: boolean } | null>(null);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!selected || (event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')) return;
      if (event.key === 'Escape') { setSelected(false); actions.patch({ captionTrackSelected: false }); }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); actions.detachCaption(); setSelected(false); }
    };
    const clear = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.preview-caption,.captions-modal')) setSelected(false);
      if (state.captionTrackSelected && !target.closest('.preview-caption,.caption-segment,.captions-word-editor,.captions-modal,button,input,select')) actions.patch({ captionTrackSelected: false });
    };
    window.addEventListener('keydown', key); window.addEventListener('pointerdown', clear);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('pointerdown', clear); };
  }, [selected, state.captionTrackSelected, actions]);
  const sampleWords = !captions.generated && !doc.words.length && hasVariant('cap-d1'); // sample after "Delete all captions"
  const groups = useMemo(() => captionGroups(sampleWords ? initialWords() : doc.words, Number(doc.style.maxChars ?? 35), !!doc.style.singleWord || doc.style.animation === 'One word at a time'), [doc, sampleWords]);
  // cap-d1: before generating, the Captions tab shows a sample with the chosen preset of style and format.
  const sample = !captions.generated && hasVariant('cap-d1') && state.activeTab === 'Captions';
  if ((!captions.generated && !sample) || state.screenId === 'T02' || !['Captions', 'Export'].includes(state.activeTab)) return null;
  const sampleTime = sample ? (groups[0]?.[0]?.startMs ?? 0) / 1000 + (time % 3) : time; // loop the first lines while not generated
  const group = groups.find(g => sampleTime * 1000 >= g[0].startMs && sampleTime * 1000 < g[g.length - 1].endMs) ?? (sample ? groups[0] : undefined);
  if (!group || state.detachedCaptionSegments.includes(Math.min(9, Math.floor(time / Math.max(.1, state.duration / 10))))) return null;
  const savePosition = (y: number, width = doc.width) => actions.commit({ captions: writeCaption(captions, { ...doc, y, width }) }, 'Position captions');
  const speaker = doc.speakers.find(s => s.id === group[0].speaker);
  const emoji = aiMocks.emojiTags.find(tag => tag.sentence === group[0].sentence)?.emoji;
  const avatarPosition = String(doc.style.avatarPosition || 'Bottom');
  const sentenceMotion = captionMotion(doc.style.animationTarget === 'Sentence animations' ? String(doc.style.animation) : 'None', sampleTime * 1000 - group[0].startMs);
  return <div ref={root} className={`preview-caption caption-live ${selected ? 'caption-selected' : ''} ${sample ? 'caption-sample' : ''}`} data-caption-text={group.map(w => w.text).join(' ')}
    data-avatar-position={avatarPosition} style={{ top: `${draft?.y ?? doc.y}%`, bottom: 'auto', left: `${(100 - (draft?.width ?? doc.width)) / 2}%`, right: 'auto', width: `${draft?.width ?? doc.width}%` }}
    onPointerDown={event => {
      if ((event.target as HTMLElement).closest('.caption-toolbar')) return;
      event.stopPropagation(); setSelected(true); actions.patch({ selectedElementId: null, captionTrackSelected: true });
      drag.current = { x: event.clientX, y: event.clientY, top: doc.y, width: doc.width, resize: !!(event.target as HTMLElement).closest('.caption-handle') };
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      if (!drag.current || !root.current?.parentElement) return;
      const { width, height } = root.current.parentElement.getBoundingClientRect(); const start = drag.current;
      setDraft({ y: start.resize ? start.top : Math.max(5, Math.min(95, start.top + (event.clientY - start.y) / height * 100)),
        width: start.resize ? Math.max(25, Math.min(98, start.width + (event.clientX - start.x) / width * 200)) : start.width });
    }} onPointerUp={event => {
      if (!drag.current) return;
      if (draft) savePosition(draft.y, draft.width);
      drag.current = null; setDraft(null); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }} onPointerCancel={() => { drag.current = null; setDraft(null); }}>
    <div className="caption-content" style={{ ...captionStyle(doc.style, true), ...sentenceMotion }}>
      {captions.settings['Speaker avatars'] && <span className="caption-avatar-icon" style={{ background: speaker?.color }} title={speaker?.name}>{speaker?.name.slice(0, 1) || 'S'}</span>}
      <span className="caption-word-line"><CaptionWords group={group} doc={doc} time={sampleTime} settings={captions.settings} /></span>
      {captions.settings.Emojis && emoji && <span className="caption-emoji-icon">{emoji}</span>}
    </div>
    {selected && <><span className="caption-handle" role="button" aria-label="Resize caption box" /><div className="caption-toolbar" onPointerDown={event => event.stopPropagation()}>
      <button onClick={() => actions.pushPage({ type: 'edit', title: 'Edit caption style' })}>Edit style</button>
      {([['Top', 18], ['Middle', 50], ['Bottom', 75]] as const).map(([label, y]) => <button key={label} onClick={() => savePosition(y)}>{label}</button>)}
      <button onClick={() => { actions.detachCaption(); setSelected(false); }}>Hide in this range</button>
    </div></>}
  </div>;
}
