import { templateFields } from '../data';
import { screenSeeds } from '../screens';
import type { EditorState } from './types';
import { loadBrand, withBrandSticker } from '../shell/brand-sticker';
import { applyClipState } from '../clip-state';
import { hasVariant } from '../variant';
import { activeScenario } from '../start/scenarios';

export function initialState(): EditorState {
  const screenId = new URLSearchParams(window.location.search).get('screen') || '';
  const base: EditorState = {
    screenId, routeId: screenId, activeTab: 'Layouts', selectedElementId: null, elements: [], effects: [], audio: [],
    captions: { generated: false, preset: 'Floating Words', text: 'RELOADING.', settings: {} }, captionTrackSelected: false, opacityOpen: false, toolbarHint: '',
    layoutId: 'Circle facecam', safeZone: 'YouTube preview', safeMenuOpen: false, zoom: 'Fit (65.6%)', subPages: [], snapping: true,
    modal: '', plan: 'premium', upsellFeature: '', selectedCrop: null, panelCollapsed: false, undoLabel: '', redoLabel: '', toast: '', overview: false, profileMenu: false, quality: (()=>{try{return localStorage.getItem('ek-claude-quality')||'1080p60'}catch{return '1080p60'}})(), templateName: 'Split',
    templateFields: Object.fromEntries(templateFields.map(name => [name, true])),
    timelineZoom: .1, playhead: 0, playing: false, duration: 60, splitPoints: [], detachedCaptionSegments: [],
    removedRanges: [], cropOverrides: {}, segmentLayouts: {}, clipVolume: 100, clipMuted: false, mutedParts: [], outputRatio: '9:16', sourceRatio: '16:9', sourceUploaded: false, aiReviewOpen: false, aiReviewDone: false, exported: false,
  };
  const state = { ...base, ...(screenSeeds[screenId] || screenSeeds.default), routeId: screenId };
  // Start from app.eklipse.gg: the clip opens with the template's layout and the video track only; StartBoot adds the rest.
  const scenario = activeScenario();
  if (scenario) return { ...state, activeTab: 'Layouts', layoutId: scenario.layout, templateName: scenario.template, elements: [], effects: [], audio: [], captions: { ...state.captions, generated: false }, playhead: 0 };
  // C8: a new clip (default, L-, R- and H-screens) starts with the saved brand sticker; Elements QA screens keep their seeds.
  if ((hasVariant('ch-stickers') || loadBrand().auto) && (!screenId || /^[LRH]/.test(screenId))) state.elements = withBrandSticker(state);
  return applyClipState(state, new URLSearchParams(window.location.search).get('clip'));
}
