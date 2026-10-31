import { useEffect, useState } from 'react';
import { useEditor } from '../../state';
import { hasVariant } from '../../variant';
import type { CaptionDocument, CaptionWord } from './model';
export function TranscriptEditor({ doc, update, regenerate }: { doc: CaptionDocument; update: (doc: CaptionDocument, label: string) => void; regenerate: () => void }) {
  const { state, actions } = useEditor(); const [selected, setSelected] = useState<number | null>(null);
  const [speakerMenu, setSpeakerMenu] = useState<number | null>(state.screenId === 'C03' ? doc.words.findIndex(w => w.speaker === 'S2') : null);
  const groups: { words: CaptionWord[]; start: number }[] = [];
  doc.words.forEach((word, index) => { const last = groups[groups.length - 1]; if (last && last.words[0].sentence === word.sentence) last.words.push(word); else groups.push({ words: [word], start: index }); });
  const changeWord = (index: number, change: Partial<CaptionWord>, label: string) => update({ ...doc, words: doc.words.map((word, i) => i === index ? { ...word, ...change } : word) }, label);
  function merge() {
    const index = selected ?? 0, words = [...doc.words]; const current = words[index], next = words[index + 1];
    if (!next) { actions.notify('Select a word that has a following word to merge'); return; }
    words.splice(index, 2, { ...current, text: `${current.text} ${next.text}`, endMs: next.endMs }); update({ ...doc, words }, 'Merge caption words'); setSelected(index);
  }
  function split(index: number) {
    const words = [...doc.words], word = words[index]; const space = word.text.indexOf(' '); const pivot = space > 0 ? space : Math.ceil(word.text.length / 2);
    if (word.text.length < 2) { actions.notify('A word needs at least two characters to split'); return; }
    const middle = Math.round((word.startMs + word.endMs) / 2);
    words.splice(index, 1, { ...word, text: word.text.slice(0, pivot), endMs: middle }, { ...word, text: word.text.slice(pivot).trim(), startMs: middle });
    update({ ...doc, words }, 'Split caption word');
  }
  useEffect(() => {
    if (selected === null) return;
    const key = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')) return;
      if (event.key === 'Escape' || event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.key !== 'Escape') update({ ...doc, words: doc.words.filter((_, i) => i !== selected) }, 'Delete caption word');
        setSelected(null); actions.patch({ captionTrackSelected: false });
      }
    };
    const clear = (event: PointerEvent) => { if (!(event.target as HTMLElement).closest('.caption-word,.captions-word-editor,.captions-speaker-menu,.captions-text-actions')) setSelected(null); };
    window.addEventListener('keydown', key, true); window.addEventListener('pointerdown', clear, true);
    return () => { window.removeEventListener('keydown', key, true); window.removeEventListener('pointerdown', clear, true); };
  }, [selected, doc, actions]);
  const word = selected === null ? null : doc.words[selected];
  return <div className="captions-transcript">
    {groups.map(({ words, start }) => {
      const speaker = doc.speakers.find(sp => sp.id === words[0].speaker); const inGroup = selected !== null && selected >= start && selected < start + words.length;
      return <div key={`${start}-${words[0].sentence}`} className={`captions-line ${inGroup ? 'selected' : ''}`}>
        <div className="captions-line-head"><span className="captions-line-dot" style={{ background: speaker?.color }} />
          <small>{(words[0].startMs / 1000).toFixed(1)}s</small>
        </div>
        <div className="captions-line-copy">{words.map((w, i) => <button className={selected === start + i ? 'caption-word selected' : 'caption-word'} key={i} onClick={() => { setSelected(start + i); actions.patch({ playhead: w.startMs / 1000, captionTrackSelected: true, selectedElementId: null }); }}>{w.text}</button>)}</div>
        {speakerMenu === start && <div className="captions-speaker-menu">{doc.speakers.filter(sp => sp.id !== 'S1' || state.screenId !== 'C03').map(sp => <button key={sp.id} onClick={() => { update({ ...doc, words: doc.words.map((w, i) => i >= start && i < start + words.length ? { ...w, speaker: sp.id } : w) }, 'Assign caption speaker'); setSpeakerMenu(null); }}><span>◯</span> {sp.name}{speaker?.id === sp.id && <b>✓</b>}</button>)}<button onClick={() => { actions.pushPage({ type: 'edit', title: 'Edit speakers', category: 'Speakers' }); setSpeakerMenu(null); }}>Edit speakers</button></div>}
      </div>;
    })}
    {word && selected !== null && <div className="captions-word-editor" onKeyDown={event => { if (event.key === 'Escape') setSelected(null); }}>
      <label>Edit word<input aria-label="Caption word text" {...(hasVariant('cap-word-replace') ? { autoFocus: true, onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); setSelected(null); } } } : {})} value={word.text} onChange={event => changeWord(selected, { text: event.target.value }, 'Edit caption word')} /></label>
      <div className="captions-word-tools">{(['startMs', 'endMs'] as const).map(field => <div key={field}><span>{field === 'startMs' ? 'Start' : 'End'}: {(word[field] / 1000).toFixed(1)}s</span>{[-100, 100].map(delta => <button key={delta} onClick={() => {
        const value = Math.max(0, Math.min(state.duration * 1000, word[field] + delta));
        if (field === 'startMs' && value >= word.endMs || field === 'endMs' && value <= word.startMs) { actions.notify('End time must be after start time'); return; }
        changeWord(selected, { [field]: value }, 'Adjust caption timing'); actions.patch({ playhead: (field === 'startMs' ? value : word.startMs) / 1000 });
      }}>{field === 'startMs' ? 'Start' : 'End'} {delta > 0 ? '+' : '−'}0.1s</button>)}</div>)}</div>
      <div className="captions-word-tools"><button onClick={merge}>Merge with next</button><button onClick={() => split(selected)}>Split word</button><button onClick={() => { update({ ...doc, words: doc.words.filter((_, i) => i !== selected) }, 'Delete caption word'); setSelected(null); }}>Delete word</button></div>
    </div>}
    <div className="captions-text-actions" hidden><button onClick={() => {
      const start = Math.min(Math.max(0, state.duration * 1000 - 700), Math.round(state.playhead * 1000)), sentence = Math.max(-1, ...doc.words.map(w => w.sentence)) + 1;
      const words = [...doc.words, { text: 'New caption', startMs: start, endMs: Math.min(state.duration * 1000, start + 700), sentence, speaker: doc.speakers[0].id }].sort((a, b) => a.startMs - b.startMs);
      update({ ...doc, words }, 'Add caption'); actions.patch({ playhead: start / 1000 }); setSelected(words.findIndex(w => w.sentence === sentence));
    }}>＋ Add caption</button><button onClick={merge}>Merge</button><button onClick={regenerate}>Regenerate captions</button></div>
    <button className="captions-delete-all" onClick={() => { actions.commit({ captions: { ...state.captions, generated: false, text: JSON.stringify({ ...doc, words: [] }) } }, 'Delete all captions'); setSelected(null); }}>Delete all captions ♲</button>
  </div>;
}
