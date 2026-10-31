import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import type { Tab } from '../data';
import { tabs } from '../data';
import { createHistory } from './history';
import { initialState } from './initial-state';
import { getEngine } from '../engine/playback-engine';
import { projectKeys } from './types';
import { cropKey, layoutAt, segmentRecipe, segmentKey } from '../engine/layout-recipes';
import type { EditorActions, EditorState, TrackItem } from './types';

type ListKey = 'elements'|'effects'|'audio';
const listKey = (kind: TrackItem['kind']): ListKey => kind === 'element' ? 'elements' : kind === 'effect' ? 'effects' : 'audio';
const mapItems = (s: EditorState, fn: (list: TrackItem[]) => TrackItem[]) => ({ elements: fn(s.elements), effects: fn(s.effects), audio: fn(s.audio) });

const Context = createContext<{ state: EditorState; actions: EditorActions }|null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EditorState>(initialState);
  // The ref is the source of truth so several actions in one event see each
  // other's result, and history is recorded exactly once per action.
  const ref = useRef(state);
  const history = useRef(createHistory()).current;

  const actions = useMemo<EditorActions>(() => {
    const apply = (change: Partial<EditorState>) => { const { undo, redo } = history.peek(); ref.current = { ...ref.current, ...change, undoLabel: undo, redoLabel: redo }; setState(ref.current); };
    const commit = (change: Partial<EditorState>, label = '') => { if (projectKeys.some(key => key in change && JSON.stringify(ref.current[key]) !== JSON.stringify(change[key]))) history.record(ref.current, label); apply(change); };
    const notify = (message: string) => apply({ toast: message });
    const restore = (step: ReturnType<typeof history.undo>, verb: string) => {
      if (!step) { notify('Nothing to ' + verb.toLowerCase()); return; }
      const s = { ...ref.current, ...step.project };
      const exists = [...s.elements, ...s.effects, ...s.audio].some(x => x.id === s.selectedElementId);
      apply({ ...step.project, selectedElementId: exists ? s.selectedElementId : null, toast: verb + (step.label ? ' “' + step.label + '”' : '') });
    };
    const a: EditorActions = {
      patch: apply, commit, notify,
      chooseTab: (tab: Tab) => apply({ activeTab: tab, panelCollapsed: false, screenId: '', subPages: [], selectedElementId: null, captionTrackSelected: false, opacityOpen: false, toolbarHint: '', profileMenu: false, toast: '' }),
      chooseLayout: layout => commit({ layoutId: layout, toast: '' }, 'Change layout'),
      pushPage: page => apply({ subPages: [...ref.current.subPages, page] }),
      popPage: () => apply({ subPages: ref.current.subPages.slice(0, -1) }),
      addItem: item => {
        const id = 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        const key = listKey(item.kind);
        commit({ [key]: [...ref.current[key], { ...item, id }], selectedElementId: id, captionTrackSelected: false }, 'Add ' + item.label);
        return id;
      },
      updateItem: (id, change) => commit(mapItems(ref.current, list => list.map(x => x.id === id ? { ...x, ...change } : x)), 'Edit ' + ([...ref.current.elements, ...ref.current.effects, ...ref.current.audio].find(x => x.id === id)?.label ?? 'item')),
      duplicateItem: id => {
        const item = ref.current.elements.find(x => x.id === id);
        if (!item) return;
        const pos = item.preview || { x: 38, y: 49, width: 24, height: 7, opacity: 100 };
        a.addItem({ ...item, preview: { ...pos, x: Math.min(90 - pos.width, pos.x + 6), y: Math.min(90 - pos.height, pos.y + 6) } });
      },
      reorderElement: (id, direction) => {
        const list=ref.current.elements.slice(), from=list.findIndex(x=>x.id===id);
        if(from<0)return;
        const [item]=list.splice(from,1);
        const to=direction==='front'?list.length:direction==='back'?0:direction==='forward'?Math.min(list.length,from+1):Math.max(0,from-1);
        list.splice(to,0,item);
        commit({elements:list},'Reorder element');
      },
      removeItem: id => {
        const s = ref.current;
        commit({ ...mapItems(s, list => list.filter(x => x.id !== id)), selectedElementId: s.selectedElementId === id ? null : s.selectedElementId, opacityOpen: false }, 'Delete item');
      },
      split: () => {
        const s = ref.current;
        const at=getEngine().time;
        if (at < 1 || at > s.duration - 1) { notify('Segment is too short to split at this position'); return; }
        const layout=layoutAt(at,s.layoutId,s.splitPoints,s.segmentLayouts);
        const cropOverrides={...s.cropOverrides};
        for(const crop of segmentRecipe(layout,at,s.splitPoints,s.cropOverrides).crops) cropOverrides[cropKey(layout,at,crop.id)]={...crop};
        commit({ splitPoints: [...s.splitPoints, at].sort((x, y) => x - y), cropOverrides, segmentLayouts:{...s.segmentLayouts,[segmentKey(at)]:layout}, toast: 'Video split at playhead' }, 'Split video');
      },
      detachCaption: () => {
        const s = ref.current;
        commit({ detachedCaptionSegments: [...s.detachedCaptionSegments, Math.min(9, Math.floor(s.playhead / 6))], captionTrackSelected: false, toast: 'Captions detached in this part of the video' }, 'Detach captions');
      },
      undo: () => restore(history.undo(ref.current), 'Undo'),
      redo: () => restore(history.redo(ref.current), 'Redo'),
    };
    return a;
  }, [history]);

  return <Context.Provider value={{ state, actions }}>{children}</Context.Provider>;
}

export function useEditor() { const value = useContext(Context); if (!value) throw new Error('EditorProvider missing'); return value; }
export const nextTab = (tab: Tab, delta: number): Tab => tabs[Math.max(0, Math.min(tabs.length - 1, (tabs as readonly Tab[]).indexOf(tab) + delta))];
