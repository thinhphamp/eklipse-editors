import { layoutAt, segmentStart } from '../../../engine/layout-recipes';
import { getEngine } from '../../../engine/playback-engine';
import type { EditorState } from '../../../state/types';
import './layout-part-picker.css';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** lay-part-picker: with split points, list the parts; a pick moves the playhead there so tiles apply to that part. */
export const partIndex = (state: Pick<EditorState, 'playhead' | 'splitPoints'>) =>
  state.splitPoints.filter(p => p <= state.playhead).length + 1;

export function PartPicker({ state }: { state: Pick<EditorState, 'playhead' | 'splitPoints' | 'layoutId' | 'segmentLayouts' | 'duration'> }) {
  const starts = [0, ...state.splitPoints];
  const here = segmentStart(state.playhead, state.splitPoints);
  const go = (start: number) => { const e = getEngine(); e.pause(); e.seek(start); };
  return <div className="part-picker" role="group" aria-label="Clip parts">
    {starts.map((start, i) => {
      const end = starts[i + 1] ?? state.duration;
      const layout = layoutAt(start, state.layoutId, state.splitPoints, state.segmentLayouts);
      const active = start === here;
      return <button key={start} type="button" className={'part-row' + (active ? ' active' : '')} aria-pressed={active} onClick={() => go(start)}>
        <strong>Part {i + 1}</strong><span>{clock(start)}-{clock(end)}</span><em>{layout}</em>{active && <small>Applies to this part</small>}
      </button>;
    })}
  </div>;
}
