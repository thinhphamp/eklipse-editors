import type { LayoutName, Tab } from '../data';

export type PreviewPosition = { x: number; y: number; width: number; height: number; opacity: number };
export type TrackItem = {
  id: string; label: string; kind: 'element'|'effect'|'audio'; category: string; start: number; duration: number; preview?: PreviewPosition;
  /** Path under public/ (media/...) for audio, stickers, GIFs, memes, emotes. */
  media?: string;
  /** Audio: 0-100; fades in seconds; offset into the file in seconds; loop to fill the item. */
  volume?: number; fadeIn?: number; fadeOut?: number; offset?: number; loop?: boolean;
  /** Effects: Speed Control rate, Zoom factor and focus point, shader name. */
  speed?: number; zoom?: number; focus?: { x: number; y: number }; shader?: string;
  /** Elements: in/out animation names and per-item style payload owned by the tab. */
  animationIn?: string; animationOut?: string; style?: Record<string, string|number|boolean>;
  /** C9: placed by AI Edit, listed in the AI review strip until the user keeps or removes it. */
  ai?: boolean;
};
export type Range = { start: number; end: number };
export type SubPage = { type: 'gallery'|'edit'|'detail'; title: string; category?: string };
export type CaptionState = { generated: boolean; preset: string; text: string; settings: Record<string, boolean> };

// Slices. Only the project slice is part of undo/redo history; selection,
// playback and ui state stay where the user left them.
export type ProjectSlice = {
  layoutId: LayoutName; elements: TrackItem[]; effects: TrackItem[]; audio: TrackItem[]; captions: CaptionState;
  duration: number; splitPoints: number[]; detachedCaptionSegments: number[];
  /** Source-time ranges deleted from the video; playback skips them. */
  removedRanges: Range[];
  /** Crop edits per `<layout>:<cropId>` (source/target/shape), see engine/layout-recipes. */
  cropOverrides: Record<string, Partial<import('../engine/layout-recipes').Crop>>;
  /** Layout per split segment, keyed by segment start (`segmentKey`); missing = clip layout. */
  segmentLayouts: Record<string, LayoutName>;
  /** Original clip audio. */
  clipVolume: number; clipMuted: boolean; mutedParts: string[];
  /** C10: output frame. 16:9 keeps the horizontal source as is (letterboxed in the phone preview). */
  outputRatio: '9:16'|'16:9';
  sourceRatio: '9:16'|'16:9';
  sourceUploaded: boolean;
  quality: string; templateName: string; templateFields: Record<string, boolean>;
};
export type SelectionSlice = { selectedElementId: string|null; captionTrackSelected: boolean };
export type PlaybackSlice = { playhead: number; playing: boolean; timelineZoom: number };
export type UiSlice = {
  screenId: string; routeId: string; activeTab: Tab; subPages: SubPage[]; opacityOpen: boolean; toolbarHint: string;
  safeZone: string; safeMenuOpen: boolean; zoom: string; snapping: boolean; modal: ''|'template'|'upload'|'upsell'|'export';
  /** Demo plan switch (Free shows premium gates) and the feature that opened the upsell dialog. */
  plan: 'free'|'premium'; upsellFeature: string;
  /** Crop selected in the source view; the preview outlines its output area. */
  selectedCrop: string|null;
  /** Side panel collapsed with the header button; any rail tab reopens it. */
  panelCollapsed: boolean;
  /** Labels of the next undo/redo steps, for the Undo/Redo tooltips. */
  undoLabel: string; redoLabel: string;
  toast: string; overview: boolean; profileMenu: boolean;
  /** C9: AI review strip expanded / finished (kept all or nothing left to review). */
  aiReviewOpen: boolean; aiReviewDone: boolean;
  exported: boolean;
  /** Two-clip flow fixture; absent from ordinary sessions. */
  clipIndex?: number;
  savedCaptionPreset?: string;
};
export type EditorState = ProjectSlice & SelectionSlice & PlaybackSlice & UiSlice;

export const projectKeys = [
  'layoutId','elements','effects','audio','captions','duration','splitPoints','detachedCaptionSegments','removedRanges','cropOverrides','segmentLayouts','clipVolume','clipMuted','mutedParts','outputRatio',
  'quality','templateName','templateFields','sourceRatio','sourceUploaded',
] as const satisfies readonly (keyof ProjectSlice)[];

export type EditorActions = {
  patch: (change: Partial<EditorState>) => void;
  /** Like patch, but records an undo step first. */
  commit: (change: Partial<EditorState>, label?: string) => void;
  chooseTab: (tab: Tab) => void; chooseLayout: (layout: LayoutName) => void;
  pushPage: (page: SubPage) => void; popPage: () => void;
  addItem: (item: Omit<TrackItem,'id'>) => string; updateItem: (id:string, change:Partial<TrackItem>) => void;
  duplicateItem: (id:string) => void; reorderElement: (id:string, direction:'front'|'back'|'forward'|'backward') => void; removeItem: (id: string) => void;
  notify: (message: string) => void; split: () => void; detachCaption: () => void; undo: () => void; redo: () => void;
};
