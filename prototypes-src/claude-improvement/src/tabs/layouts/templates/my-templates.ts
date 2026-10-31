import type { EditorState } from '../../../state';
import type { LayoutName } from '../../../data';
import { layoutNames } from '../../../data';
import { loadStyleKits, type StyleKit } from '../../export/style-kits';
import { loadTemplates, saveTemplate, writeTemplates } from '../../export/template-store';
import { cameraGroups } from '../variants/layout-camera-groups';

// Templates panel (tpl-grid, design-drafts/261029-templates-menu C2). Two kinds in one grid:
// - Saved: the user's own templates (template-store) plus the demo style kits. Renamed and deleted in the panel.
// - Eklipse: one preset per layout, each with a caption style and the social sticker (applyStyleKit adds the sticker).
// Every template applies to the whole clip.

export type Template = { id: string; name: string; layout: LayoutName; summary: string; caption?: string; saved: boolean; kit: StyleKit };

/** Caption style per Eklipse template, from the Captions catalog. Draft pairing; product to confirm. */
const presetCaptions: Record<LayoutName, [string, string]> = {
  'Split': ['THE HOOK.', 'hook'], 'Circle facecam': ['WORD', 'comic'], 'Small facecam': ['HITS', 'green'], 'Game UI': ['THE HOOK.', 'hook'],
  'Blurred': ['Let it bloom.', 'aqua'], 'Fullscreen': ['HITS', 'green'], 'Basecam': ['WORD', 'comic'], 'Mosaic': ['THE GOOD PART.', 'red'],
  'Dual facecam': ['WORDS YOU SING BACK.', 'thin'], 'Duo Split': ['THE HOOK.', 'hook'], 'Half': ['EVERY', 'comic'],
};
export const presets: Template[] = layoutNames.map(layout => {
  const [caption, flavor] = presetCaptions[layout];
  return { id: 'preset-' + layout, name: layout, layout, caption, saved: false, summary: caption + ' captions · sticker',
    kit: { id: 'preset-' + layout, name: layout, summary: '', layout, captionPreset: caption, captionFlavor: flavor, source: 'demo' } };
});

/** Number of cameras a layout shows, for the camera filter chips (same groups as lay-cam-groups). */
export const cameraCount = (layout: LayoutName) => {
  const i = cameraGroups.findIndex(g => g.layouts.includes(layout));
  return cameraGroups[i]?.title === 'No camera' ? 0 : cameraGroups[i]?.title === 'Two cameras' ? 2 : 1;
};

// Per-user overlay for templates the store can't edit (demo kits) and for "last used first" ordering.
type Meta = { hidden: string[]; names: Record<string, string>; order: string[] };
const metaKey = 'ek-claude-my-templates';
const readMeta = (): Meta => { try { return { hidden: [], names: {}, order: [], ...JSON.parse(localStorage.getItem(metaKey) || '{}') }; } catch { return { hidden: [], names: {}, order: [] }; } };
const writeMeta = (m: Meta) => { try { localStorage.setItem(metaKey, JSON.stringify(m)); } catch { /* private mode */ } };
const savedId = (name: string) => 'saved:' + name;

/** The user's templates, last used first. Saved-but-never-used ones (e.g. saved from Export) come first. */
export function myTemplates(): Template[] {
  const meta = readMeta();
  const all = loadStyleKits().map((kit): Template => {
    const id = kit.template ? savedId(kit.name) : kit.id;
    const summary = kit.template ? Object.entries(kit.template.fields).filter(([, on]) => on).map(([f]) => f).filter(f => f !== 'Layout').slice(0, 3).join(' · ') || 'Layout' : kit.summary.split(' · ').slice(1).join(' · ');
    return { id, name: meta.names[id] || kit.name, layout: kit.layout, summary, caption: kit.captionPreset || kit.template?.project.captions?.preset, saved: true, kit };
  }).filter(t => !meta.hidden.includes(t.id));
  const rank = (t: Template) => { const i = meta.order.indexOf(t.id); return i < 0 ? -1 : i; };
  // Unused ones: your own saves newest first, then the demo kits in their order.
  const fresh = (a: { t: Template; i: number }, b: { t: Template; i: number }) => a.t.kit.template && b.t.kit.template ? b.i - a.i : a.i - b.i;
  return all.map((t, i) => ({ t, i })).sort((a, b) => rank(a.t) - rank(b.t) || fresh(a, b)).map(x => x.t);
}

/** Move a saved template to the front ("last used"). */
export function touchTemplate(id: string) { const m = readMeta(); writeMeta({ ...m, order: [id, ...m.order.filter(x => x !== id)] }); }

export function uniqueName(name: string, skipId?: string) {
  const taken = (n: string) => myTemplates().some(t => t.id !== skipId && t.name.toLowerCase() === n.toLowerCase());
  const base = name.trim(); let next = base, k = 2;
  while (taken(next)) next = `${base} (${k++})`;
  return next;
}

/** Returns the template's id after the rename (saved templates are keyed by name). */
export function renameTemplate(id: string, name: string): string {
  const t = myTemplates().find(x => x.id === id); const clean = name.trim();
  if (!t || !clean || clean === t.name) return id;
  const next = uniqueName(clean, id); const m = readMeta();
  if (t.kit.template) {
    const old = t.kit.template.name;
    writeTemplates(loadTemplates().map(x => x.name === old ? { ...x, name: next } : x));
    const nid = savedId(next); writeMeta({ ...m, order: m.order.map(x => x === id ? nid : x) }); return nid;
  }
  writeMeta({ ...m, names: { ...m.names, [id]: next } }); return id;
}

/** Deletes and returns an undo function. */
export function deleteTemplate(id: string): () => void {
  const t = myTemplates().find(x => x.id === id); const before = loadTemplates(), meta = readMeta();
  if (!t) return () => {};
  if (t.kit.template) writeTemplates(before.filter(x => x.name !== t.kit.template!.name));
  else writeMeta({ ...meta, hidden: [...meta.hidden, id] });
  return () => { writeTemplates(before); writeMeta(meta); };
}

/** Saves the current edit with every part included; returns the new template's id. */
export function saveCurrentAsTemplate(state: EditorState): string {
  const day = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const name = uniqueName(`${state.layoutId} · ${day}`);
  saveTemplate({ ...state, templateName: name, templateFields: { Layout: true, Text: true, Captions: true, Gifs: true, Stickers: true, 'Sound Effects': true, 'Video Effects': true, 'AI Word Censoring': true } });
  touchTemplate(savedId(name));
  return savedId(name);
}

const filterKey = 'ek-claude-template-filter';
export type Filter = 'all' | 'saved' | '0' | '1' | '2';
export const loadFilter = (): Filter => { try { return (localStorage.getItem(filterKey) as Filter) || 'all'; } catch { return 'all'; } };
export const saveFilter = (f: Filter) => { try { localStorage.setItem(filterKey, f); } catch { /* private mode */ } };
