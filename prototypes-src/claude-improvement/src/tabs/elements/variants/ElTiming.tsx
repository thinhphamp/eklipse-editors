import { useMemo } from 'react';
import { useEditor } from '../../../state';
import { keptRanges, outputToSource } from '../../../engine/timeline-map';
import './variants.css';

// Variant el-timing: start and length of the selected element as buttons, not only timeline drags.
const mmss = (s: number) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

export function ElTiming({ list = 'elements' }: { list?: 'elements' | 'effects' | 'audio' }) {
  const { state, actions } = useEditor();
  const item = state[list].find(x => x.id === state.selectedElementId);
  const kept = useMemo(() => keptRanges(state.removedRanges, state.duration), [state.removedRanges, state.duration]);
  if (!item) return null;
  const end = state.duration, dur = Math.round(item.duration * 10) / 10;
  const toPlayhead = () => {
    const at = Math.max(0, outputToSource(state.playhead, kept));
    // Audio is often as long as the clip: start where asked and cut its tail to fit, instead of snapping back to 0.
    const start = list === 'audio' ? Math.min(at, Math.max(0, end - 1)) : Math.min(at, Math.max(0, end - Math.min(item.duration, end)));
    actions.updateItem(item.id, { start, duration: Math.min(item.duration, end - start) });
  };
  const setDur = (d: number) => actions.updateItem(item.id, { duration: Math.max(1, Math.min(d, end - item.start)) });
  // Elements only (Thinh, 29 Oct): one click keeps the element on screen for the whole clip.
  const whole = item.start <= 0.01 && item.start + item.duration >= end - 0.01;
  return <div className="el-timing">
    <div className="el-timing-row"><span>Starts at <b>{mmss(item.start)}</b></span>
      <button onClick={toPlayhead}>Move to playhead</button></div>
    <div className="el-timing-row"><span>Show for</span>
      <span className="el-timing-step">
        <button aria-label="Show for 1 second shorter" disabled={dur <= 1} onClick={() => setDur(item.duration - 1)}>−</button>
        <b>{dur} s</b>
        <button aria-label="Show for 1 second longer" disabled={item.start + item.duration >= end - 0.01} onClick={() => setDur(item.duration + 1)}>+</button>
        {list === 'elements' && <button className={whole ? 'el-timing-whole active' : 'el-timing-whole'} aria-pressed={whole} onClick={() => actions.updateItem(item.id, { start: 0, duration: end })}>Whole clip</button>}
      </span></div>
  </div>;
}
