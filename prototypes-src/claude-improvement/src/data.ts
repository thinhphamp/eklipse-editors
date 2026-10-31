import model from './fixtures/sl-editor-model.json';
import { hasVariant } from './variant';
export const tabs = ['Layouts', 'Elements', 'Effects', 'Audio', 'Captions', 'Export'] as const;
export type Tab = typeof tabs[number] | 'Socials'; // 'Socials' only with variant soc-rail-tab or ch-stickers
// Claude improvement C2 (revised 2026-10-27): rail ordered by how much each tool goes with an exported clip on the web
// (19,562 projects, 5-22 Oct). Layout preset in 85.7% of projects; captions +29.4 and text +45.9 export points when the
// same user adds them; background music 3.8% use and no gain. Export moves to the top bar (C1).
export const railTabs = ['Layouts', 'Captions', 'Elements', 'Effects', 'Audio'] as const satisfies readonly Tab[];
/** Visible tab name. The id stays 'Layouts' (state, screens, probes); with tpl-grid users see "Templates". */
export const tabLabel = (tab: string) => tab === 'Layouts' && hasVariant('tpl-grid') ? 'Templates' : tab === 'Socials' && hasVariant('ch-stickers') ? 'Channel stickers' : tab;
/** Rail order; the socials tab sits 2nd, after Templates. */
export const railOrder = (): readonly Tab[] => hasVariant('soc-rail-tab') || hasVariant('ch-stickers') ? [railTabs[0], 'Socials', ...railTabs.slice(1)] : railTabs;
export const layoutNames = ['Small facecam','Circle facecam','Game UI','Split','Blurred','Fullscreen','Basecam','Mosaic','Dual facecam','Duo Split','Half'] as const;
export type LayoutName = typeof layoutNames[number];
export const layoutRecipes = model.layouts.presets;
export const exportOptions = model.export.options;
export const animationPresets = model.animations.entryExitPresets;
export const shaderPresets = model.effects.shaderPresets;
export const soundCategories = model.soundEffectCategories;
export const templateFields = ['Layout','Text','Captions','Gifs','Stickers','Sound Effects','Video Effects','AI Word Censoring','AI Remove Silences'] as const;
export const qualityChoices = [
  { id:'720p30', resolution:'720p', fps:'30 fps', name:'Standard 720p', description:'Content creation starts here' },
  { id:'720p60', resolution:'720p', fps:'60 fps', name:'720p High Frame Rate', description:'Enhanced smoothness', tier:'Starter' },
  { id:'1080p60', resolution:'1080p', fps:'60 fps', name:'Full HD 1080p', description:'Best for creators', tier:'Starter' },
  { id:'2160p60', resolution:'4K', fps:'60 fps', name:'Ultra HD 4K', description:'The sharpest your video can look', tier:'Pro' },
] as const;
