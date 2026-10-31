import { useState } from 'react';
import { builtInPresets, type SavedStyle } from './presets';
import { EmojiCard, FormatCards } from './FormatCards';
import { PresetTile } from './PresetTile';
import type { Preset } from '../catalog';
import type { CaptionDocument } from '../model';

export const captionLanguages = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Auto-detect'];

/** Before captions are generated: language, how captions show, auto emoji, preset of style, Generate. */
export function CaptionSetup({ doc, preset, saved, language, setLanguage, setWords, emoji, setEmoji, pickPreset, pickSaved, editPreset, generate, busy, remembered }: {
  doc: CaptionDocument; preset: string; saved: SavedStyle[]; language: string; setLanguage: (v: string) => void;
  setWords: (v: boolean) => void; emoji: boolean; setEmoji: (v: boolean) => void; pickPreset: (item: Preset) => void; pickSaved: (item: SavedStyle) => void;
  editPreset: () => void; generate: () => void; busy: boolean; remembered: boolean;
}) {
  const [all, setAll] = useState(false);
  const flavor = String(doc.style.presetFlavor || 'comic');
  const isBuiltIn = (item: Preset) => preset === item.text && flavor === (item.flavor || 'comic');
  const savedSel = saved.find(item => item.name === preset);
  // Collapsed: saved presets of style first, then built-ins, 4 tiles; the selected one always shows.
  let tiles: ({ saved: SavedStyle } | { item: Preset })[] = [...saved.map(s => ({ saved: s })), ...builtInPresets.map(item => ({ item }))];
  if (!all) {
    const selected = tiles.find(t => 'saved' in t ? t.saved === savedSel : isBuiltIn(t.item));
    tiles = tiles.slice(0, 4); if (selected && !tiles.includes(selected)) tiles = [selected, ...tiles.slice(0, 3)];
  }
  const words = !!doc.style.singleWord;
  return <div className="cap-d1-setup">
    {remembered && <p className="cap-d1-remember">Using your last clip's settings: {words ? 'Word by word' : 'Full phrases'} · Emoji {emoji ? 'on' : 'off'} · {preset}</p>}
    <label className="cap-d1-label" htmlFor="cap-d1-language">Caption language</label>
    <select id="cap-d1-language" className="cap-d1-select" value={language} onChange={event => setLanguage(event.target.value)}>{captionLanguages.map(name => <option key={name}>{name}</option>)}</select>
    <div className="cap-d1-label">Show captions as</div>
    <FormatCards words={words} set={setWords} />
    <div className="cap-d1-label">Emoji</div>
    <EmojiCard on={emoji} set={setEmoji} />
    <div className="cap-d1-label">Preset of style <button className="cap-d1-link" onClick={() => setAll(!all)}>{all ? 'Show less' : 'See all'}</button></div>
    <div className={`captions-preset-grid ${all ? '' : 'cap-d1-grid4'}`}>
      {tiles.map((t, i) => 'saved' in t
        ? <PresetTile key={`s${t.saved.name}`} saved={t.saved} compact={!all} selected={t.saved === savedSel} onPick={() => pickSaved(t.saved)} onEdit={editPreset} />
        : <PresetTile key={`b${i}${t.item.text}${t.item.flavor}`} item={t.item} compact={!all} selected={!savedSel && isBuiltIn(t.item)} onPick={() => pickPreset(t.item)} onEdit={editPreset} />)}
    </div>
    <button className="captions-primary cap-d1-generate" disabled={busy} onClick={generate}>{busy ? 'Generating captions…' : 'Generate captions'}</button>
    <p className="cap-d1-note">The video shows a sample with your choices. You can change all of them after.</p>
  </div>;
}
