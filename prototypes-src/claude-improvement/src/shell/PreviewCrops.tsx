import {useEditor} from '../state';
import {cropKey, layoutAt, segmentRecipe, segmentStart, type Crop, type Rect} from '../engine/layout-recipes';
import {useState} from 'react';
import {hasVariant} from '../variant';

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function PreviewCrops(){
  const {state,actions}=useEditor();
  const [adjusting,setAdjusting]=useState(false);
  const layout=layoutAt(state.playhead,state.layoutId,state.splitPoints,state.segmentLayouts);
  const start=segmentStart(state.playhead,state.splitPoints);
  const crops=segmentRecipe(layout,state.playhead,state.splitPoints,state.cropOverrides).crops.filter(c=>c.source.w>0&&c.target.w>0);
  const save=(c:Crop,target:Rect,label:string)=>{const key=cropKey(layout,start,c.id);actions.commit({cropOverrides:{...state.cropOverrides,[key]:{...state.cropOverrides[key],target}}},label)};
  const selected=crops.find(c=>c.id===state.selectedCrop);
  const edit=(c:Crop,change:Partial<Crop>,label:string)=>{const key=cropKey(layout,start,c.id);actions.commit({cropOverrides:{...state.cropOverrides,[key]:{...state.cropOverrides[key],...change}}},label)};
  const nudge=(dx:number,dy:number)=>{const crop=selected||crops.find(c=>/facecam/i.test(c.role))||crops.find(c=>/gameplay/i.test(c.role));if(!crop)return;const target={...crop.target,x:clamp(crop.target.x+dx,0,1-crop.target.w),y:clamp(crop.target.y+dy,0,1-crop.target.h)};actions.patch({selectedCrop:crop.id});save(crop,target,'Adjust framing')};
  const drag=(e:React.PointerEvent<HTMLButtonElement>,c:Crop,handle?:string)=>{
    e.preventDefault();e.stopPropagation();actions.patch({selectedCrop:c.id});
    const host=e.currentTarget.closest<HTMLElement>('.phone-preview');if(!host)return;
    const box=host.getBoundingClientRect(),x=e.clientX,y=e.clientY,origin=c.target;
    const key=cropKey(layout,start,c.id);
    let draft=origin,started=false;
    const move=(ev:PointerEvent)=>{
      const dx=(ev.clientX-x)/box.width,dy=(ev.clientY-y)/box.height;
      if(handle){const left=handle.includes('left'),top=handle.includes('top');let w=clamp(origin.w+(left?-dx:dx),.05,1),h=clamp(origin.h+(top?-dy:dy),.05,1);if(c.shape==='circle'){if(Math.abs(ev.clientX-x)>=Math.abs(ev.clientY-y))h=clamp(w*box.width/box.height,.05,1);else w=clamp(h*box.height/box.width,.05,1)}draft={x:clamp(left?origin.x+origin.w-w:origin.x,0,1-w),y:clamp(top?origin.y+origin.h-h:origin.y,0,1-h),w,h}}
      else {const snap=(v:number)=>state.snapping&&Math.abs(v-.5)<.025?.5:v;draft={...origin,x:clamp(snap(origin.x+dx),0,1-origin.w),y:clamp(snap(origin.y+dy),0,1-origin.h)}}
      if(!started){save(c,draft,'Move crop in preview');started=true}else actions.patch({cropOverrides:{...state.cropOverrides,[key]:{...state.cropOverrides[key],target:draft}}});
    };
    const up=()=>{if(started)actions.patch({cropOverrides:{...state.cropOverrides,[key]:{...state.cropOverrides[key],target:draft}}});window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  };
  return <>{crops.map(c=><button key={c.id} data-tone={c.color||(c.role==='Gameplay'?'blue':'pink')} className={'preview-crop-target '+(state.selectedCrop===c.id?'selected':'')} style={{left:c.target.x*100+'%',top:c.target.y*100+'%',width:c.target.w*100+'%',height:c.target.h*100+'%'}} aria-label={'Select '+c.role+' crop'} onPointerDown={e=>drag(e,c)}>{state.selectedCrop===c.id&&['top-left','top-right','bottom-left','bottom-right'].map(pos=><i key={pos} className={'crop-handle '+pos} onPointerDown={e=>{e.stopPropagation();drag(e as unknown as React.PointerEvent<HTMLButtonElement>,c,pos)}}/>)}</button>)}{hasVariant('frame-handle')&&<div className="frame-adjust"><button className="frame-adjust-toggle" onClick={()=>{if(!selected){const crop=crops.find(c=>/facecam/i.test(c.role))||crops.find(c=>/gameplay/i.test(c.role));if(crop)actions.patch({selectedCrop:crop.id})}setAdjusting(!adjusting)}}>⌖ Adjust framing</button>{adjusting&&<div className="frame-nudges" role="group" aria-label="Nudge framing"><button aria-label="Move framing up" onClick={()=>nudge(0,-.015)}>↑</button><button aria-label="Move framing left" onClick={()=>nudge(-.015,0)}>←</button><button aria-label="Move framing down" onClick={()=>nudge(0,.015)}>↓</button><button aria-label="Move framing right" onClick={()=>nudge(.015,0)}>→</button></div>}</div>}{selected&&state.activeTab!=='Layouts'&&<div className="preview-crop-toolbar" role="toolbar" aria-label="Crop controls"><button onClick={()=>edit(selected,{z:Math.max(...crops.map(c=>c.z))+1},'Bring crop to front')}>Bring to front</button><button onClick={()=>{const id='custom-'+Date.now(),key=cropKey(layout,start,id);actions.commit({cropOverrides:{...state.cropOverrides,[key]:{...selected,id,role:'New Crop',color:'lavender',source:{...selected.source,x:clamp(selected.source.x-.067,0,1-selected.source.w),y:clamp(selected.source.y-.07,0,1-selected.source.h)},target:{...selected.target,x:clamp(selected.target.x-.067,0,1-selected.target.w),y:clamp(selected.target.y-.07,0,1-selected.target.h)}}}},'Duplicate crop');actions.patch({selectedCrop:id})}}>Duplicate</button><button onClick={()=>{edit(selected,{source:{...selected.source,w:0,h:0}},'Delete crop');actions.patch({selectedCrop:null})}}>Delete</button></div>}</>;
}
