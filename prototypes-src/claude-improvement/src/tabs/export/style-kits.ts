import type { EditorState, TrackItem } from '../../state';
import type { LayoutName } from '../../data';
import { transcript } from '../../fixtures';
import { initialWords, presetStyle, writeCaption } from '../captions/model';
import { withBrandSticker } from '../../shell/brand-sticker';
import { applyTemplate, loadTemplates, type SavedTemplate } from './template-store';

// Claude improvement C3: "My styles". Paid users export ~3 clips a week and repeat the same small set of
// changes. Web projects (5-22 Oct): 72.6% reuse the previous layout and 62.5% of caption users change the caption
// style, so a style is layout + captions; music is optional (3.8% of projects, no export gain). A style applies that set in one click, from the top bar or the
// Layouts panel, instead of hiding saved templates at the bottom of the Export panel. Every style keeps the
// brand sticker (C8): it is the one thing streamers put on every clip.
export type StyleKit = { id: string; name: string; summary: string; layout: LayoutName; captionPreset?: string; captionFlavor?: string; music?: { label: string; media: string; volume: number }; source: 'demo'|'saved'; template?: SavedTemplate };

const demoKits: StyleKit[] = [
  { id: 'kit-fps', name: 'My FPS clips', summary: 'Split · Hook captions · Brand sticker', layout: 'Split', captionPreset: 'THE HOOK.', captionFlavor: 'hook', source: 'demo' },
  { id: 'kit-chat', name: 'Just chatting', summary: 'Circle facecam · Comic captions · Brand sticker', layout: 'Circle facecam', captionPreset: 'WORD', captionFlavor: 'comic', source: 'demo' },
];

// Usability probes set 'ek-claude-history' to 'none' to play a user with no demo history: no demo styles and an empty
// "Recently used" row until they export. Unset (the default) keeps the demo history below.
const noDemoHistory = () => { try { return localStorage.getItem('ek-claude-history') === 'none'; } catch { return false; } };

export function loadStyleKits(): StyleKit[] {
  const saved = loadTemplates().map((t, i): StyleKit => ({ id: 'saved-' + i, name: t.name, summary: 'Saved template · ' + t.layout, layout: t.layout as LayoutName, source: 'saved', template: t }));
  return noDemoHistory() ? saved : [...saved, ...demoKits];
}

/** One undoable change: layout, crops reset, captions generated in the kit style, music bed replaced, brand sticker kept. */
export function applyStyleKit(kit: StyleKit, state: EditorState): Partial<EditorState> {
  if (kit.template) { const change = applyTemplate(kit.template, state); return { ...change, elements: withBrandSticker({ elements: change.elements ?? state.elements, duration: state.duration }) }; }
  const change: Partial<EditorState> = { layoutId: kit.layout, segmentLayouts: {}, cropOverrides: {}, elements: withBrandSticker(state) };
  if (kit.captionPreset) {
    const caption = { ...state.captions, preset: kit.captionPreset, generated: true };
    change.captions = writeCaption(caption, { words: initialWords(), y: 75, width: 82, style: { ...presetStyle(kit.captionPreset, kit.captionFlavor), presetFlavor: kit.captionFlavor || 'comic' }, speakers: transcript.speakers });
    change.detachedCaptionSegments = [];
  }
  if (kit.music) {
    const bed: TrackItem = { id: 'item-' + Date.now() + '-kit', label: kit.music.label, kind: 'audio', category: 'Music', media: kit.music.media, start: 0, duration: Math.max(60, state.duration), volume: kit.music.volume, loop: true };
    change.audio = [...state.audio.filter(x => x.category !== 'Music'), bed];
  }
  return change;
}

const lastKey = 'ek-claude-last-layouts';
/** Recently used layouts (C4): the layouts of the clips you last exported, newest first. Falls back to the demo
 * history so the row is never empty. Picking a tile in the editor does not reorder it, so the panel stays stable. */
export function recentLayouts(): LayoutName[] {
  try { const v = JSON.parse(localStorage.getItem(lastKey) || '[]'); if (Array.isArray(v) && v.length) return v.slice(0, 3); } catch { /* private mode */ }
  return noDemoHistory() ? [] : ['Split', 'Circle facecam'];
}
/** Called once per export with the clip's layouts (main layout first, then per-segment layouts). */
export function rememberExportedLayouts(used: LayoutName[]) {
  const fresh = [...new Set(used)];
  try { localStorage.setItem(lastKey, JSON.stringify([...fresh, ...recentLayouts().filter(x => !fresh.includes(x))].slice(0, 3))); } catch { /* private mode */ }
}
