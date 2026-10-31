import type { LayoutName } from '../data';

/** Normalised rectangle (0-1) in source (16:9) or output (9:16) space. */
export type Rect = { x: number; y: number; w: number; h: number };
export type CropRole = 'Gameplay'|'Facecam'|'Facecam Left'|'Facecam Right'|'Map'|'Game UI'|'New Crop';
export type Crop = { id: string; role: CropRole; source: Rect; target: Rect; shape: 'rect'|'rounded'|'circle'; z: number; color?: 'yellow'|'lavender'; /** Rounded corner radius as a fraction of the crop's shorter side. */ radius?: number };
export type Recipe = { crops: Crop[]; blurBackground: boolean };

export const SOURCE = { width: 1280, height: 720 };
export const OUTPUT = { width: 1080, height: 1920 };

// Where things are in media/demo.mp4 (checked on a frame at 18 s).
const regions = {
  gameplay: { x: .15, y: 0, w: .7, h: 1 },
  facecam: { x: .719, y: .201, w: .281, h: .282 },
  faceTight: { x: .79, y: .2, w: .19, h: .29 },
  faceLeft: { x: .719, y: .201, w: .14, h: .282 },
  faceRight: { x: .86, y: .201, w: .14, h: .282 },
  map: { x: .02, y: .02, w: .21, h: .33 },
  hud: { x: .27, y: .89, w: .46, h: .11 },
} satisfies Record<string, Rect>;

/** Largest rect with the target's pixel aspect, centred inside `box` (CSS object-fit: cover). */
export function coverSource(box: Rect, target: Rect): Rect {
  const want = (target.w * OUTPUT.width) / (target.h * OUTPUT.height);
  const have = (box.w * SOURCE.width) / (box.h * SOURCE.height);
  if (have > want) { const w = box.w * want / have; return { x: box.x + (box.w - w) / 2, y: box.y, w, h: box.h }; }
  const h = box.h * have / want;
  return { x: box.x, y: box.y + (box.h - h) / 2, w: box.w, h };
}

type Spec = [id: string, role: CropRole, region: keyof typeof regions, target: Rect, shape?: Crop['shape']];
const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });
const specs: Record<LayoutName, { blur: boolean; crops: Spec[] }> = {
  'Small facecam': { blur: true, crops: [['gameplay','Gameplay','gameplay',r(0,.22,1,.56)], ['facecam','Facecam','facecam',r(.25,.09,.5,.28),'rounded']] },
  'Circle facecam': { blur: true, crops: [['gameplay','Gameplay','gameplay',r(0,.22,1,.56)], ['facecam','Facecam','faceTight',r(.25,.09,.5,.28),'circle']] },
  'Game UI': { blur: false, crops: [['facecam','Facecam','facecam',r(0,0,1,.26)], ['hud','Game UI','hud',r(0,.26,1,.08)], ['gameplay','Gameplay','gameplay',r(0,.32,1,.68)]] },
  Split: { blur: false, crops: [['facecam','Facecam','facecam',r(0,0,1,.4)], ['gameplay','Gameplay','gameplay',r(0,.4,1,.6)]] },
  Blurred: { blur: true, crops: [['gameplay','Gameplay','gameplay',r(0,.24,1,.54)]] },
  Fullscreen: { blur: false, crops: [['gameplay','Gameplay','gameplay',r(0,0,1,1)]] },
  Basecam: { blur: false, crops: [['gameplay','Gameplay','gameplay',r(0,0,1,1)], ['facecam','Facecam','facecam',r(0,0,0,0)]] },
  Mosaic: { blur: false, crops: [['facecam','Facecam','facecam',r(0,0,.5,.27)], ['map','Map','map',r(.5,0,.5,.27)], ['gameplay','Gameplay','gameplay',r(0,.27,1,.73)]] },
  'Dual facecam': { blur: false, crops: [['gameplay','Gameplay','gameplay',r(0,.3,1,.7)], ['cam-left','Facecam Left','faceLeft',r(.05,.05,.43,.24),'circle'], ['cam-right','Facecam Right','faceRight',r(.52,.05,.43,.24),'circle']] },
  'Duo Split': { blur: false, crops: [['cam-left','Facecam Left','faceLeft',r(0,0,.5,.3)], ['cam-right','Facecam Right','faceRight',r(.5,0,.5,.3)], ['gameplay','Gameplay','gameplay',r(0,.3,1,.7)]] },
  Half: { blur: false, crops: [['facecam','Facecam','facecam',r(0,0,1,.5)], ['gameplay','Gameplay','gameplay',r(0,.5,1,.5)]] },
};

export const recipes = Object.fromEntries(Object.entries(specs).map(([name, spec]) => [name, {
  blurBackground: spec.blur,
  crops: spec.crops.map(([id, role, region, target, shape = 'rect'], i) => ({
    id, role, target, shape, z: role === 'Gameplay' ? 0 : i + 1, source: target.w && target.h ? coverSource(regions[region], target) : regions[region],
  })),
}])) as Record<LayoutName, Recipe>;

/** Layout in effect at source time `t`: a split segment's own layout, else the clip layout. */
export function layoutAt(t: number, base: LayoutName, splitPoints: number[], segmentLayouts: Record<string, LayoutName>): LayoutName {
  const start = [0, ...splitPoints].filter(s => s <= t).sort((a, b) => b - a)[0] ?? 0;
  return segmentLayouts[segmentKey(start)] ?? base;
}
export const segmentKey = (start: number) => start.toFixed(2);
export const segmentStart = (t: number, points: number[]) => [0, ...points].filter(s => s <= t).sort((a,b) => b-a)[0] ?? 0;
export const cropKey = (layout: LayoutName, start: number, id: string) => `${layout}@${segmentKey(start)}:${id}`;

/** A split inherits its parent's complete crop snapshot; later edits use this segment only. */
export function segmentRecipe(layout: LayoutName, t: number, points: number[], overrides: Record<string, Partial<Crop>>): Recipe {
  const start = segmentStart(t, points);
  const base = resolveRecipe(layout, overrides);
  const prefix = `${layout}@${segmentKey(start)}:`;
  const crops = base.crops.map(c => ({...c, ...overrides[prefix+c.id]}));
  for (const [key, extra] of Object.entries(overrides)) {
    if (!key.startsWith(prefix) || !extra.source || !extra.target || crops.some(c => c.id === key.slice(prefix.length))) continue;
    crops.push({id:key.slice(prefix.length), role:extra.role || 'Facecam', source:extra.source, target:extra.target, shape:extra.shape || 'rect', z:extra.z ?? crops.length+1, radius:extra.radius, color:extra.color});
  }
  return {...base, crops:crops.filter(c => !overrides[prefix+c.id]?.source || c.source.w > 0).sort((a,b)=>a.z-b.z)};
}

/** Recipe with the user's crop edits (keyed `<layout>:<cropId>`) applied. */
export function resolveRecipe(layout: LayoutName, overrides: Record<string, Partial<Crop>> = {}): Recipe {
  const base = recipes[layout];
  const crops = base.crops.map(c => ({ ...c, ...overrides[layout + ':' + c.id] }));
  for (const [key, extra] of Object.entries(overrides))
    if (key.startsWith(layout + ':') && extra.source && extra.target && !crops.some(c => layout + ':' + c.id === key))
      crops.push({ id: key.slice(layout.length + 1), role: extra.role || 'Facecam', shape: extra.shape || 'rect', z: crops.length + 1, source: extra.source, target: extra.target });
  return { ...base, crops: crops.sort((a, b) => a.z - b.z) };
}
