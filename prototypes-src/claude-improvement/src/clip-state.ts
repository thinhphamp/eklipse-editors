import type { EditorState } from './state/types';

const ai = (id: string, label: string, kind: 'element'|'effect'|'audio', category: string, start: number, duration: number) => ({ id, label, kind, category, start, duration, ai: true });

/** Optional usability-probe fixtures. No query parameter leaves the default state untouched. */
export function applyClipState(state: EditorState, clip: string | null): EditorState {
  if (!clip) return state;
  if (clip === 'two-clips') return { ...state, clipIndex: 1 };
  if (clip === 'ai-bundle') return { ...state,
    elements: [ai('ai-meme-1', 'AI clutch meme', 'element', 'Gifs', 18, 5), ai('ai-meme-2', 'AI reaction meme', 'element', 'Gifs', 34, 5)],
    effects: [ai('ai-zoom', 'AI Zoom', 'effect', 'Zoom', 18, 5)],
    audio: [ai('ai-sfx', 'AI Impact', 'audio', 'Gaming', 18, 2)], aiReviewOpen: false, aiReviewDone: false,
  };
  if (clip === 'horizontal-kept') return { ...state, sourceRatio: '16:9', outputRatio: '16:9' };
  if (clip === 'no-facecam') return { ...state, layoutId: 'Fullscreen', sourceRatio: '9:16', outputRatio: '9:16', elements: [], effects: [], audio: [] };
  if (clip === 'vertical-upload') return { ...state, sourceRatio: '9:16', outputRatio: '9:16', sourceUploaded: false };
  return state;
}
