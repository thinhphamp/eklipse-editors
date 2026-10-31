import { useEffect, useState } from 'react';
import { useEditor } from '../../state';
import { LayoutCanvas } from '../../shell/LayoutCanvas';
import { getEngine } from '../../engine/playback-engine';
import { Playback } from '../../shell/Playback';
import { keptDuration, keptRanges } from '../../engine/timeline-map';
import { rememberExportedLayouts } from './style-kits';
export function ExportFlow({name,onClose,watermark}:{name:string;onClose:()=>void;watermark:boolean}){const {state,actions}=useEditor();const [progress,setProgress]=useState(0);const [running,setRunning]=useState(true);const seconds=keptDuration(keptRanges(state.removedRanges,state.duration));
  // Recently used (C4) is fed by exported clips, not by picks in the Layouts panel.
  useEffect(()=>{rememberExportedLayouts([state.layoutId,...Object.values(state.segmentLayouts)])},[]);// eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{if(!running||progress>=100)return;const interval=setInterval(()=>setProgress(p=>Math.min(100,p+Math.max(1,100/(Math.max(1,seconds/6)*5)))),100);return()=>clearInterval(interval)},[running,progress,seconds]);useEffect(()=>{if(progress>=100)actions.patch({exported:true})},[progress,actions]);return <div className="modal-shade" onMouseDown={onClose}><div className="export-flow" role="dialog" aria-modal="true" aria-label="Export progress" onMouseDown={e=>e.stopPropagation()}><button className="dialog-x" onClick={onClose} aria-label="Close">×</button>{progress<100?<><h2>Exporting {name}</h2><p>Preparing your clip preview</p><progress value={progress} max="100"/><strong>{Math.floor(progress)}%</strong><button onClick={()=>{setRunning(false);onClose()}}>Cancel</button></>:<><h2>Your clip is ready</h2><div className="export-player"><LayoutCanvas layout={state.layoutId} live/>{watermark&&<span className="export-watermark">Eklipse</span>}</div><Playback/><p>Download saves the local demo file as your named clip.</p><a href="media/demo.mp4" download={(name.trim()||'eklipse-clip')+'.mp4'}>Download demo file</a></>}</div></div>}
