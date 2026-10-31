import type { EditorState, ProjectSlice } from './types';
import { projectKeys } from './types';

const LIMIT = 100;
// Repeated edits with the same label inside this window (slider drags, element
// drags) collapse into one undo step.
const COALESCE_MS = 600;

export type Snapshot = { project: ProjectSlice; label: string };
export function projectOf(state: EditorState): ProjectSlice {
  return Object.fromEntries(projectKeys.map(key => [key, state[key]])) as ProjectSlice;
}

export function createHistory() {
  const past: Snapshot[] = [];
  const future: Snapshot[] = [];
  let last = { label: '', at: 0 };
  return {
    record(state: EditorState, label: string) {
      const now = Date.now();
      if (label && label === last.label && now - last.at < COALESCE_MS) { last.at = now; return; }
      last = { label, at: now };
      past.push({ project: projectOf(state), label });
      if (past.length > LIMIT) past.shift();
      future.length = 0;
    },
    undo(state: EditorState): Snapshot|null {
      const step = past.pop();
      if (!step) return null;
      future.push({ project: projectOf(state), label: step.label });
      last = { label: '', at: 0 };
      return step;
    },
    redo(state: EditorState): Snapshot|null {
      const step = future.pop();
      if (!step) return null;
      past.push({ project: projectOf(state), label: step.label });
      last = { label: '', at: 0 };
      return step;
    },
    peek: () => ({ undo: past[past.length-1]?.label ?? '', redo: future[future.length-1]?.label ?? '' }),
  };
}
