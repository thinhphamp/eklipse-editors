import { useStageFit } from './use-stage-fit';
import { useEditor } from '../state';
import { SourceCanvas, LayoutCanvas } from './LayoutCanvas';
import { PreviewElements } from './PreviewElements';
import { PreviewCaption } from './PreviewCaption';
import { SocialsPreviewPill } from '../tabs/elements/variants/social/SocialsPreviewPill';
import { ChannelGhost } from '../tabs/channel/ChannelGhost';
import { hasVariant } from '../variant';
import { ToggleRow } from '../ui/ToggleRow';
import { Icon } from '../ui/Icon';
import { cropKey, layoutAt, segmentStart } from '../engine/layout-recipes';
import { PreviewCrops } from './PreviewCrops';
import { ApplyMyLook } from '../tabs/export/LookSaveAction';
import { PreviewStrip, SafeZoneTag, previewScale, useStripOn, zoneShort } from './preview-strip/PreviewStrip';

function SocialOverlay({safeZone}:{safeZone:string}) {return <div className={'social-overlay '+(safeZone==='No safe zones'?'no-safe':safeZone.toLowerCase().split(' ')[0])}>
  <div className="social-top"><Icon name="back" size={24}/><div><Icon name="search" size={20}/><Icon name="camera" size={20}/><span>⋮</span></div></div>
  <div className="social-actions"><span>♥<small>1.1m</small></span><span>▣<small>6969</small></span><span>➤<small>Share</small></span><span>◈<small>Remix</small></span></div>
  <div className="social-meta"><strong>@samplecreator</strong><b>Subscribe</b><p>You should subscribe to us #now #ok</p><p>♫ Original sound</p></div>
  
  </div>}
export function PhonePreview({compact=false}:{compact?:boolean}) {
  const {state,actions}=useEditor();const selectedCrop=state.selectedCrop;const setSelectedCrop=(id:string|null)=>actions.patch({selectedCrop:id});
  const second=state.screenId==='T02'?5:state.activeTab==='Export'?50:(state.playhead||18);
  return <div className={'phone-preview '+(compact?'compact':'')} onPointerDown={e=>{if(e.target===e.currentTarget)setSelectedCrop(null)}}>
    <LayoutCanvas layout={state.layoutId} second={second} live landscape={state.outputRatio==='16:9'}/>{state.activeTab==='Layouts'&&state.outputRatio!=='16:9'&&<PreviewCrops/>}
    {['x21','x23'].includes(state.routeId)&&<div className="legacy-clutch-title">Clutch<br/>play!</div>}
    <SocialOverlay safeZone={state.safeZone}/>
    <PreviewCaption/>
    <PreviewElements/>
    {hasVariant('ch-stickers')&&!compact&&<ChannelGhost/>}
    {(hasVariant('soc-preview-entry')||hasVariant('soc-v2'))&&!compact&&<SocialsPreviewPill/>}
    {state.screenId==='x21'&&<div className="legacy-element-toolbar">◇ &nbsp;&nbsp; 🗑</div>}
  </div>;
}
export function Preview() {
  const {state,actions}=useEditor();
  const isLayouts=state.activeTab==='Layouts';
  const strip=useStripOn();
  const stageRef=useStageFit(isLayouts,strip);
  const zoomScale=state.zoom.startsWith('Fit')?'none':`scale(${strip?previewScale(state.zoom):Number.parseInt(state.zoom,10)/33})`;
  return <><section ref={stageRef} className={'stage '+(isLayouts?'stage-layouts':'stage-export')+(strip?' pv-on':'')}>
    {isLayouts&&state.outputRatio!=='16:9'&&<div className="source-column"><div className="stage-label">{layoutAt(state.playhead,state.layoutId,state.splitPoints,state.segmentLayouts)}</div><SourceCanvas layout={layoutAt(state.playhead,state.layoutId,state.splitPoints,state.segmentLayouts)} second={state.playhead||18}/><div className="source-actions">{!['Game UI','Basecam','Fullscreen'].includes(state.layoutId)&&<button onClick={()=>{const id='custom-'+Date.now();actions.commit({cropOverrides:{...state.cropOverrides,[cropKey(layoutAt(state.playhead,state.layoutId,state.splitPoints,state.segmentLayouts),segmentStart(state.playhead,state.splitPoints),id)]:{id,role:'New Crop',color:'yellow',source:{x:.255,y:.25,w:.49,h:.5},target:{x:0,y:.34,w:1,h:.32},shape:'rect',z:10}}},'Add crop');actions.patch({selectedCrop:null})}}>＋ Add crop</button>}<ToggleRow label="Enable snapping" value={state.snapping} onChange={v=>actions.patch({snapping:v})} compact/></div></div>}
    <div className="preview-column"><ApplyMyLook/>{isLayouts&&<div className="stage-label">Preview{strip&&state.safeZone!=='No safe zones'&&state.outputRatio!=='16:9'&&<span className="pv-label-zone"> · {zoneShort(state.safeZone)} safe zone</span>}</div>}<div className="pv-anchor">{strip&&!isLayouts&&<SafeZoneTag/>}<div className="preview-zoom-shell" style={{transform:zoomScale,transformOrigin:'center top'}}><PhonePreview/></div>{strip&&<PreviewStrip/>}</div>{!strip&&<div className="preview-select">{state.routeId==='x03'?<><button className="safe-zone-button" onClick={()=>actions.patch({safeMenuOpen:!state.safeMenuOpen})}>{state.safeZone} ⌄</button>{state.safeMenuOpen&&<div className="safe-zone-menu">{['No safe zones','YouTube preview','TikTok preview','Instagram preview'].map(zone=><button key={zone} className={zone===state.safeZone?'selected':''} onClick={()=>actions.patch({safeZone:zone,safeMenuOpen:false})}>{zone}</button>)}</div>}</>:<select aria-label="Safe zone preview" value={state.safeZone} onChange={e=>actions.patch({safeZone:e.target.value})}><option>YouTube preview</option><option>TikTok preview</option><option>Instagram preview</option><option>No safe zones</option></select>}</div>}</div>
  </section></>;
}
