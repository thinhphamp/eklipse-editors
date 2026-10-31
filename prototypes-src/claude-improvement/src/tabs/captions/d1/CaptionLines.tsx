import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../../../state';
import { usePlaybackTime } from '../../../engine/use-playback';
import type { CaptionDocument, CaptionWord } from '../model';

const fmt = (ms: number) => { const s = ms / 1000; return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`; };
type Line = { sentence: number; words: CaptionWord[]; start: number; end: number; first: number };
function linesOf(words: CaptionWord[]): Line[] {
  const out: Line[] = [];
  words.forEach((word, index) => { const last = out[out.length - 1]; if (last && last.sentence === word.sentence) { last.words.push(word); last.end = word.endMs; } else out.push({ sentence: word.sentence, words: [word], start: word.startMs, end: word.endMs, first: index }); });
  return out;
}

/** Nearest scrolling ancestor (the side panel), so auto-scroll moves the panel, not the page. */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowY; if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p; }
  return null;
}

/** Text tab, cap-d1 · D1 + K (30 Oct): one row per line with its time range. While the clip plays the current line lights up,
 *  words already said are underlined, the current word is a pill, and the list follows the playhead.
 *  Click a word = seek; double-click or ✎ = edit (design-drafts/261030-captions-tab, variant K). */
export function CaptionLines({ doc, update, regenerate }: { doc: CaptionDocument; update: (doc: CaptionDocument, label: string) => void; regenerate: () => void }) {
  const { state, actions } = useEditor(); const time = usePlaybackTime() * 1000;
  const [editing, setEditing] = useState<number | null>(null); const [edits, setEdits] = useState(0); const [confirm, setConfirm] = useState(false);
  const input = useRef<HTMLInputElement>(null); const open = useRef<number | null>(null); open.current = editing;
  const lines = linesOf(doc.words);
  const root = useRef<HTMLDivElement>(null); const [following, setFollowing] = useState(true); const auto = useRef(false);
  useEffect(() => { input.current?.focus(); input.current?.select(); }, [editing]);
  // Current line (kept lit briefly after its last word) and current word (stays on the last word started, no flicker in gaps).
  const nowIndex = lines.findIndex(line => time >= line.start && time < line.end + 250);
  const nowLine = nowIndex >= 0 ? lines[nowIndex] : null;
  const wordIndex = nowLine ? nowLine.words.reduce((found, w, i) => w.startMs <= time ? i : found, -1) : -1;
  // Auto-scroll: keep the current line about a third from the top of the panel.
  useEffect(() => {
    if (!following || nowIndex < 0) return;
    const row = root.current?.querySelector<HTMLElement>(`[data-line="${lines[nowIndex].sentence}"]`); const box = scrollParent(root.current);
    if (!row || !box) return;
    const top = row.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - box.clientHeight * .3;
    auto.current = true; box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    const t = window.setTimeout(() => { auto.current = false; }, 600); return () => window.clearTimeout(t);
  }, [nowIndex, following]);
  // Scrolling by hand while playing pauses following until "Back to current line" or a seek.
  useEffect(() => {
    const box = scrollParent(root.current); if (!box) return;
    const manual = () => { if (!auto.current && state.playing) setFollowing(false); };
    box.addEventListener('wheel', manual, { passive: true }); box.addEventListener('touchmove', manual, { passive: true });
    return () => { box.removeEventListener('wheel', manual); box.removeEventListener('touchmove', manual); };
  }, [state.playing, lines.length]);
  const seek = (ms: number) => { setFollowing(true); actions.patch({ playhead: ms / 1000, captionTrackSelected: true }); };
  const startEdit = (line: Line) => { actions.patch({ playing: false }); setEditing(line.sentence); };
  function save(line: Line, text: string) {
    if (open.current !== line.sentence) return; open.current = null; // Enter then blur must save once
    setEditing(null); const parts = text.trim().split(/\s+/).filter(Boolean);
    if (!parts.length || parts.join(' ') === line.words.map(w => w.text).join(' ')) return;
    // New text keeps the line's time range; words share it evenly.
    const step = (line.end - line.start) / parts.length;
    const next = parts.map((part, i) => ({ ...line.words[0], fixtureIndex: undefined, text: part, startMs: Math.round(line.start + i * step), endMs: Math.round(line.start + (i + 1) * step) }));
    const words = [...doc.words]; words.splice(line.first, line.words.length, ...next);
    update({ ...doc, words }, 'Edit caption line'); setEdits(n => n + 1);
  }
  function remove(line: Line) { update({ ...doc, words: doc.words.filter(w => w.sentence !== line.sentence) }, 'Delete caption line'); setEditing(null); setEdits(n => n + 1); }
  function add() {
    // Starts at the playhead, or right after the line under it, and goes in as one block (never mixed into a line).
    const under = lines.find(line => time >= line.start && time < line.end);
    const start = Math.min(Math.max(0, state.duration * 1000 - 1200), Math.round(under ? under.end + 50 : time)), sentence = Math.max(-1, ...doc.words.map(w => w.sentence)) + 1;
    const word = { text: 'New', startMs: start, endMs: Math.min(state.duration * 1000, start + 600), sentence, speaker: doc.speakers[0].id };
    const at = lines.find(line => line.start >= start)?.first ?? doc.words.length;
    const words = [...doc.words]; words.splice(at, 0, word, { ...word, text: 'line', startMs: word.endMs, endMs: Math.min(state.duration * 1000, start + 1200) });
    update({ ...doc, words }, 'Add caption line'); setEdits(n => n + 1); setEditing(sentence); actions.patch({ playhead: start / 1000 });
  }
  const parts = [...state.splitPoints].sort((a, b) => a - b);
  const partOf = (ms: number) => parts.filter(p => p * 1000 <= ms).length + 1;
  if (!lines.length) return <div className="cap-d1-empty"><b>No speech found in this clip</b>Try another language in Effects, or add a line yourself.<div><button onClick={regenerate}>Regenerate</button><button onClick={add}>+ Add line</button></div></div>;
  let lastPart = 0;
  return <div className="cap-d1-lines" ref={root}>
    <div className="cap-d1-lines-head"><small>{lines.length} lines</small><button className="captions-primary" onClick={add}>+ Add line</button></div>
    {lines.map(line => {
      const part = parts.length ? partOf(line.start) : 0; const head = part && part !== lastPart ? <div className="cap-d1-part">Part {part}</div> : null; lastPart = part;
      const now = nowLine === line;
      return <div key={line.sentence}>{head}<div className={`cap-d1-line ${now ? 'now' : ''}`} data-line={line.sentence} onDoubleClick={event => { if (!(event.target as HTMLElement).closest('input,.cap-d1-del,.cap-d1-edit')) startEdit(line); }}>
        <button className="cap-d1-time" title="Go to this line" onClick={() => seek(line.start)}>{fmt(line.start)} – {fmt(line.end)}</button>
        {editing === line.sentence
          ? <input ref={input} aria-label="Caption line text" defaultValue={line.words.map(w => w.text).join(' ')}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); save(line, event.currentTarget.value); } if (event.key === 'Escape') { event.stopPropagation(); setEditing(null); } }}
            onBlur={event => save(line, event.currentTarget.value)} />
          : <div className="cap-d1-words">{line.words.map((w, i) => <span key={i}><button className={`cap-d1-word ${now && i === wordIndex ? 'cur' : now && i < wordIndex ? 'spoken' : ''}`} title="Go to this word" onClick={() => seek(w.startMs)}>{w.text}</button>{i < line.words.length - 1 ? ' ' : ''}</span>)}</div>}
        <span className="cap-d1-acts"><button className="cap-d1-edit" aria-label="Edit line" title="Edit line" onClick={() => startEdit(line)}>✎</button><button className="cap-d1-del" aria-label="Delete line" title="Delete line" onClick={() => remove(line)}>×</button></span>
      </div></div>;
    })}
    {!following && nowLine && <button className="cap-d1-follow" onClick={() => setFollowing(true)}>↓ Back to current line</button>}
    <button className="cap-d1-wide" onClick={() => edits ? setConfirm(true) : regenerate()}>Regenerate captions</button>
    {confirm && <div className="cap-d1-confirm"><span>Regenerate replaces your {edits} edit{edits > 1 ? 's' : ''}.</span><button onClick={() => setConfirm(false)}>Keep edits</button><button className="captions-primary" onClick={() => { setConfirm(false); setEdits(0); regenerate(); }}>Regenerate</button></div>}
    <button className="captions-delete-all" onClick={() => actions.commit({ captions: { ...state.captions, generated: false, text: JSON.stringify({ ...doc, words: [] }) } }, 'Delete all captions')}>Delete all captions</button>
  </div>;
}
