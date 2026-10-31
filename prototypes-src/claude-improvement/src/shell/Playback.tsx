import { useState } from 'react';
import { getEngine } from '../engine/playback-engine';
import { keptDuration, keptRanges, sourceToOutput } from '../engine/timeline-map';
import { usePlaybackTime } from '../engine/use-playback';
import { useEditor } from '../state';
import { Icon } from '../ui/Icon';
import { ShortcutDialog } from './ShortcutDialog';

export const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor(s % 1 * 10)}`;
export function Playback() {
  const { state, actions } = useEditor();
  const [shortcuts,setShortcuts]=useState(false);
  const [volume,setVolume]=useState(100);
  const [muted,setMuted]=useState(false);
  const [hidden,setHidden]=useState(false);
  const engine=getEngine(), time=usePlaybackTime(), kept=keptRanges(state.removedRanges,state.duration);
  const playerVolume=(value:number, isMuted=false)=>{setVolume(value);setMuted(isMuted);engine.setPlayerVolume(value/100,isMuted)};
  const fullscreen=()=>{const el=document.querySelector('.stage');if(document.fullscreenElement)void document.exitFullscreen();else if(el)void el.requestFullscreen?.().catch(()=>actions.notify('Fullscreen is not available in this browser'))};
  const toggleTimeline=()=>{const next=!hidden;setHidden(next);document.querySelector<HTMLElement>('.editor-main')?.classList.toggle('timeline-hidden',next)};
  return <div className="playback">
    <div className="timecode"><b>{formatTime(sourceToOutput(time,kept))}</b><span>/</span><span>{formatTime(keptDuration(kept))}</span></div>
    <div className="playback-center">
      <button title="Go back a frame" data-keys="J|←" onClick={()=>engine.step(-1)}><Icon name="step-back" size={18}/></button>
      <button title={state.playing?'Pause':'Play'} data-keys="K|Space" onClick={()=>engine.toggle()}><Icon name={state.playing?'pause':'play'} size={22}/></button>
      <button title="Go forward a frame" data-keys="L|→" onClick={()=>engine.step(1)}><Icon name="step-forward" size={18}/></button>
    </div>
    <div className="playback-right">
      <button title={muted?'Unmute Player':'Mute Player'} data-keys="M" onClick={()=>playerVolume(volume,!muted)}><Icon name="volume" size={16}/></button>
      <input aria-label="Player volume" type="range" min="0" max="100" value={volume} onChange={e=>playerVolume(Number(e.target.value),muted)}/>
      <button title="Fullscreen" data-keys="F" onClick={fullscreen}><Icon name="fullscreen" size={16}/></button>
      <button title="Zoom out" data-keys="⌘ -" onClick={()=>actions.patch({timelineZoom:Math.max(0,state.timelineZoom-.1)})}><Icon name="zoom-out" size={15}/></button>
      <input aria-label="Timeline zoom" type="range" min="0" max="1" step="0.01" value={state.timelineZoom} onChange={e=>actions.patch({timelineZoom:Number(e.target.value)})}/>
      <button title="Zoom in" data-keys="⌘ =" onClick={()=>actions.patch({timelineZoom:Math.min(1,state.timelineZoom+.1)})}><Icon name="zoom-in" size={15}/></button>
      <button title="Keyboard shortcuts" data-keys="⌘ /" onClick={()=>setShortcuts(true)}><Icon name="keyboard" size={16}/></button>
      <button title={hidden?'Show timeline':'Hide timeline'} onClick={toggleTimeline}><Icon name="collapse" size={16}/></button>
    </div>
    {shortcuts&&<ShortcutDialog onClose={()=>setShortcuts(false)}/>}
  </div>;
}
