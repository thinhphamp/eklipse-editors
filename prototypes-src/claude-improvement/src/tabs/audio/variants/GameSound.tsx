import { useEditor } from '../../../state';
import { segmentKey, segmentStart } from '../../../engine/layout-recipes';
import './audio-variants.css';

// Variant aud-game-sound: volume and mute for the clip's own audio, plus muting one part of a split clip.
const partName = (key: string, splitPoints: number[]) => 'Part ' + ([0, ...splitPoints].map(segmentKey).indexOf(key) + 1);

export function GameSound() {
  const { state, actions } = useEditor();
  const vol = state.clipVolume;
  const set = (v: number) => actions.commit({ clipVolume: Math.max(0, Math.min(100, v)), clipMuted: false }, 'Change game sound');
  const key = segmentKey(segmentStart(state.playhead, state.splitPoints));
  const here = state.mutedParts.includes(key);
  const toggle = () => actions.commit({ mutedParts: here ? state.mutedParts.filter(k => k !== key) : [...state.mutedParts, key] }, 'Mute game sound in part');
  const muted = state.mutedParts.filter(k => [0, ...state.splitPoints].map(segmentKey).includes(k));
  return <section className="game-sound" aria-label="Game sound">
    <div className="game-sound-row">
      <span>Game sound <b>{state.clipMuted ? 'Muted' : vol + '%'}</b></span>
      <span className="game-sound-btns">
        <button type="button" aria-label="Lower game sound by 10%" disabled={vol <= 0} onClick={() => set(vol - 10)}>−</button>
        <button type="button" aria-label="Raise game sound by 10%" disabled={vol >= 100} onClick={() => set(vol + 10)}>+</button>
        <button type="button" aria-pressed={state.clipMuted} onClick={() => actions.commit({ clipMuted: !state.clipMuted }, 'Mute game sound')}>{state.clipMuted ? 'Unmute game sound' : 'Mute game sound'}</button>
      </span>
    </div>
    {state.splitPoints.length > 0 && <div className="game-sound-row">
      <button type="button" aria-pressed={here} onClick={toggle}>{here ? 'Unmute game sound for this part' : 'Mute game sound for this part'}</button>
      <span>{muted.length ? 'Muted: ' + muted.map(k => partName(k, state.splitPoints)).join(', ') : 'No part muted'}</span>
    </div>}
  </section>;
}
