import { transcript, type TranscriptWord, type Speaker } from '../../fixtures';
import type { CaptionState } from '../../state/types';
import { presetGroups } from './catalog';
export type CaptionStyle = Record<string, string | number | boolean>;
export type CaptionWord = TranscriptWord & { fixtureIndex?: number };
export type CaptionDocument = { words: CaptionWord[]; y: number; width: number; style: CaptionStyle; speakers: (Speaker & { styled?: boolean })[] };
// One speaker per clip (Thinh 29 Oct): Eklipse has no diarisation, so every word belongs to the streamer.
const oneSpeaker = transcript.speakers.slice(0, 1);
export const initialWords = () => transcript.words.map((word, fixtureIndex) => ({ ...word, speaker: oneSpeaker[0].id, fixtureIndex }));
const palette: Record<string, string> = {
  blue: 'var(--accent-text)', aqua: 'var(--art-b5f7ff)', red: 'var(--art-ff9a9a)', mint: 'var(--art-5ffadf)',
  pink: 'var(--art-fa90df)', lilac: 'var(--art-d1a3ff)', green: 'var(--art-b3ff42)', purple: 'var(--art-ab60fa)',
  yellow: 'var(--art-ffff81)', gray: 'var(--art-a0a0a0)', black: 'var(--art-151515)', dark: 'var(--art-5a5a5a)', orange: 'var(--art-ff8f4b)',
};
export function presetStyle(name: string, flavor?: string): CaptionStyle {
  const look = flavor || presetGroups.flatMap(group => group.items).find(item => item.text === name)?.flavor || 'comic';
  return { font: look === 'hook' ? 'CaptionAnton' : look === 'thin' ? 'CaptionMontserrat' : ['aqua', 'soft', 'mint'].includes(look) ? 'CaptionPoppins' : 'CaptionBangers',
    size: look === 'thin' || look === 'secret' ? 35 : look === 'hook' ? 58 : 48, fill: palette[look] || 'var(--text-1)',
    stroke: ['black', 'dark'].includes(look) ? 'var(--text-1)' : 'var(--bg-app)', strokeWidth: look === 'thin' ? 1 : 2,
    highlight: 'Color', highlightColor: 'var(--art-ffff81)', maxChars: 35, animation: 'Karaoke bounce', breakLines: true,
    weight: 800, italic: look === 'blue', uppercase: !['aqua', 'soft', 'thin'].includes(look) };
}
export function readCaption(caption: CaptionState): CaptionDocument {
  try {
    const value = JSON.parse(caption.text);
    if (Array.isArray(value.words)) return { words: value.words, y: value.y ?? 75, width: value.width ?? 82,
      style: { ...presetStyle(caption.preset), ...value.style }, speakers: oneSpeaker };
  } catch { /* Evidence seeds carry a legacy plain string. */ }
  return { words: initialWords(), y: 75, width: 82, style: presetStyle(caption.preset), speakers: oneSpeaker };
}
export function writeCaption(caption: CaptionState, doc: CaptionDocument): CaptionState {
  return { ...caption, text: JSON.stringify(doc) };
}
export function captionGroups(words: CaptionWord[], maxChars: number, single = false): CaptionWord[][] {
  const groups: CaptionWord[][] = []; let current: CaptionWord[] = [];
  for (const word of words) {
    const length = current.map(w => w.text).join(' ').length + word.text.length + 1;
    if (current.length && (single || length > maxChars || word.sentence !== current[0].sentence || word.speaker !== current[0].speaker)) {
      groups.push(current); current = [];
    }
    current.push(word);
  }
  if (current.length) groups.push(current);
  return groups;
}
