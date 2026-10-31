// Usability-probe variants (phase 7). v1 (Thinh, 28 Oct): loop-1 winners plus look-save, frame-handle and layout-describe are on by default (evidence: plans/261027-usability-probe-skill/
// variants/review.html). `?variant=baseline` shows the prototype as it was before loop 1; `?variant=a,b` turns on
// exactly those variants (A/B runs), and `?variant=baseline,a` adds one variant to the old prototype.
// tpl-grid (Quan, 29 Oct): Layouts tab becomes "Templates", one grid of your templates + Eklipse templates with filter
// chips (design-drafts/261029-templates-menu, variant C2). `?variant=baseline` and other explicit sets show the old panel.
// ch-stickers (Quan, 30 Oct): social channel sticker leaves Elements for its own "Channel stickers" rail tab, 2nd after
// Templates; several stickers per clip, one name each, one tintable look library (design-drafts/261030-channel-sticker, B3).
// cap-d1 (Quan, 30 Oct): Captions tab keeps Text · Effects · Presets; setup before generating (language, Word by word /
// Full phrases, Auto emoji, preset of style), Text tab as line rows, presets of style editable in a popup, AI Shake /
// Supersize / Random rotation removed (design-drafts/261030-captions-tab, variant D1).
// el-tabs (Quan, 30 Oct): Elements = All · Meme · Texts · Effects tabs like production (Audio stays on the rail), one search
// across tabs with counts, "On this clip" strip with AI tags, recently used (design-drafts/261030-elements-menu, variant B).
// pv-strip (Quan, 30 Oct): safe zone + preview zoom move from the stage's top-right corner to a small icon strip on the
// player's right edge, safe-zone tag above the player, real Fit % shown, player ~8 % smaller at Fit
// (design-drafts/261030-preview-controls, variant C).
// Round 3 (Thinh, 30 Oct): `?variant=a,b` ADDS a and b to the promoted set; `baseline` in the list switches to the old prototype
// (only the other listed ids on top of it), so `?variant=baseline` is the way to get the v1 / pre-CTO panels.
export const promoted = ['el-jump', 'style-lastclip', 'brand-platforms', 'look-save', 'frame-handle', 'layout-describe', 'tpl-grid', 'ch-stickers', 'cap-d1', 'el-tabs', 'pv-strip'];
const active = (() => {
  try {
    const asked = (new URLSearchParams(location.search).get('variant') || '').split(',').filter(Boolean);
    if (!asked.length) return new Set(promoted);
    if (asked.includes('baseline')) return new Set(asked.filter(v => v !== 'baseline'));
    return new Set([...promoted, ...asked]);
  } catch { return new Set(promoted); }
})();
export const hasVariant = (id: string) => active.has(id);
