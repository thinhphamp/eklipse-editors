import { presetGroups, type Preset } from '../catalog';
import { presetStyle, type CaptionDocument, type CaptionStyle } from '../model';

// cap-d1 (Quan, 30 Oct; design-drafts/261030-captions-tab, variant D1): presets of style, saved ones and the
// settings remembered for the next clips.
export type SavedStyle = { name: string; style: CaptionStyle };
export type CaptionDefaults = { format: 'words' | 'phrases'; emoji: boolean; preset?: string; style?: CaptionStyle };
const STYLES_KEY = 'eklipse-caption-styles', DEFAULTS_KEY = 'ek-caption-defaults';

export function loadSavedStyles(): SavedStyle[] {
  try { const data = JSON.parse(localStorage.getItem(STYLES_KEY) || '[]'); return Array.isArray(data) ? data.filter(x => typeof x?.name === 'string' && x.style) : []; } catch { return []; }
}
export function storeSavedStyles(list: SavedStyle[]) { try { localStorage.setItem(STYLES_KEY, JSON.stringify(list)); return true; } catch { return false; } }
export function readDefaults(): CaptionDefaults | null {
  try { const v = JSON.parse(localStorage.getItem(DEFAULTS_KEY) || 'null'); return v && (v.format === 'words' || v.format === 'phrases') ? v : null; } catch { return null; }
}
export function rememberDefaults(change: Partial<CaptionDefaults>) {
  const next = { format: 'phrases', emoji: true, ...readDefaults(), ...change };
  try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify(next)); } catch { /* session only */ }
}

/** Built-in presets of style, each look once (the catalog repeats looks across groups). */
export const builtInPresets: Preset[] = (() => {
  const seen = new Set<string>(); const out: Preset[] = [];
  for (const item of presetGroups.flatMap(group => group.items)) { const key = `${item.text}|${item.flavor || 'comic'}`; if (!seen.has(key)) { seen.add(key); out.push(item); } }
  return out;
})();

/** Settings that belong to the clip, not to the preset of style: kept when the preset changes. */
const clipKeys = ['singleWord', 'language'];
const keepClip = (style: CaptionStyle) => Object.fromEntries(clipKeys.filter(key => key in style).map(key => [key, style[key]]));
export function withPreset(doc: CaptionDocument, item: Preset): CaptionStyle {
  return { ...presetStyle(item.text, item.flavor), presetFlavor: item.flavor || 'comic', ...keepClip(doc.style) };
}
export function withSaved(doc: CaptionDocument, saved: SavedStyle): CaptionStyle {
  return { ...saved.style, ...keepClip(doc.style) };
}
export function presetOnly(style: CaptionStyle): CaptionStyle {
  return Object.fromEntries(Object.entries(style).filter(([key]) => !clipKeys.includes(key)));
}
