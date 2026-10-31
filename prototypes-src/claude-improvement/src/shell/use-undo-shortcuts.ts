import { useEffect } from 'react';
import { getEngine } from '../engine/playback-engine';
import { keptRanges, outputToSource } from '../engine/timeline-map';
import { useEditor } from '../state';

/** Editor shortcuts, ignored in text fields and controls that own arrow keys. */
export function useUndoShortcuts() {
  const { state, actions } = useEditor();
  useEffect(() => {
    const key = (e:KeyboardEvent) => {
      const target=e.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable],dialog')) return;
      const engine=getEngine(), meta=e.metaKey||e.ctrlKey, k=e.key.toLowerCase();
      const item=state.elements.find(x=>x.id===state.selectedElementId);
      const crop=document.querySelector<HTMLElement>('.source-crop.crop-selected');
      const doIt=(fn:()=>void)=>{e.preventDefault();fn()};
      if(meta){
        if(k==='z')return doIt(e.shiftKey?actions.redo:actions.undo);
        if(k==='y')return doIt(actions.redo);
        if(k==='e')return doIt(()=>actions.patch({modal:'export'}));
        if(k==='d'&&item)return doIt(()=>actions.duplicateItem(item.id));
        if(item&&[';',"'",']','['].includes(e.key))return doIt(()=>actions.reorderElement(item.id,({';':'front',"'":'back',']':'forward','[':'backward'} as const)[e.key as ';'|"'"|']'|'[']));
        if(k==='arrowleft')return doIt(()=>engine.seek(0));
        if(k==='arrowright')return doIt(()=>engine.seek(state.duration));
        if(k==='='||k==='+')return doIt(()=>actions.patch({timelineZoom:Math.min(1,state.timelineZoom+.1)}));
        if(k==='-')return doIt(()=>actions.patch({timelineZoom:Math.max(0,state.timelineZoom-.1)}));
        if(k==='0')return doIt(()=>actions.patch({timelineZoom:0}));
        if(k==='/')return doIt(()=>document.querySelector<HTMLButtonElement>('[title="Keyboard shortcuts"],[data-tip="Keyboard shortcuts"]')?.click());
        return;
      }
      if(e.altKey)return;
      if(k==='escape')return doIt(()=>{actions.patch({selectedElementId:null,captionTrackSelected:false});window.dispatchEvent(new Event('deselect-crop'))});
      if(k==='home')return doIt(()=>engine.seek(0));
      if(k==='end')return doIt(()=>engine.seek(state.duration));
      if(/^[0-9]$/.test(k))return doIt(()=>engine.seek(outputToSource(Number(k)/10*state.duration,keptRanges(state.removedRanges,state.duration))));
      if(k==='k'||e.code==='Space')return doIt(()=>engine.toggle());
      if(k==='m')return doIt(()=>document.querySelector<HTMLButtonElement>('[title="Mute Player"],[title="Unmute Player"],[data-tip="Mute Player"],[data-tip="Unmute Player"]')?.click());
      if(k==='f')return doIt(()=>document.querySelector<HTMLButtonElement>('[title="Fullscreen"],[data-tip="Fullscreen"]')?.click());
      if(k==='s'&&!item&&!crop)return doIt(()=>document.querySelector<HTMLButtonElement>('[aria-label="Split clip at current time"]')?.click());
      if((k==='['||k===']')&&!item&&!crop)return doIt(()=>document.querySelector<HTMLButtonElement>(k==='['?'[aria-label="Trim the start"]':'[aria-label="Trim the end"]')?.click());
      if(['delete','backspace'].includes(k)&&item)return doIt(()=>actions.removeItem(item.id));
      const directions:Record<string,[number,number]>={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
      const delta=directions[k];
      if(delta&&(item||crop))return doIt(()=>{const step=e.shiftKey?5:1;if(item){const p=item.preview||{x:38,y:49,width:24,height:7,opacity:100};actions.updateItem(item.id,{preview:{...p,x:Math.max(0,Math.min(100-p.width,p.x+delta[0]*step)),y:Math.max(0,Math.min(100-p.height,p.y+delta[1]*step))}})}else if(crop){const ev=new CustomEvent('nudge-crop',{detail:{id:crop.dataset.crop,dx:delta[0]*step/100,dy:delta[1]*step/100}});window.dispatchEvent(ev)}});
      if(['j','l','arrowleft','arrowright'].includes(k))return doIt(()=>engine.step((k==='j'||k==='arrowleft'?-1:1)*(e.shiftKey?10:1)));
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[actions,state]);
}
