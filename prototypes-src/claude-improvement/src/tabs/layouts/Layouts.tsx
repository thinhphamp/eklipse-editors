import { layoutNames } from '../../data';
import type { LayoutName } from '../../data';
import { layoutAt, segmentKey } from '../../engine/layout-recipes';
import { useEditor } from '../../state';
import { PanelHeader } from '../../shell/PanelHeader';
import { LayoutCanvas } from '../../shell/LayoutCanvas';
import { Section } from '../../ui/Section';
import { TileGrid } from '../../ui/TileGrid';
import { Icon } from '../../ui/Icon';
import { useApplyStyle } from '../../shell/TopBar';
import { useState } from 'react';
import { applyStyleKit, loadStyleKits, recentLayouts } from '../export/style-kits';
import { layoutVariant, LastClipLine, LAST_BADGE } from './variants/layout-variants';
import { LookSaveAction } from '../export/LookSaveAction';
import { hasVariant } from '../../variant';
import { PartPicker, partIndex } from './variants/layout-part-picker';
import { cameraGroups, cameraDescriptions } from './variants/layout-camera-groups';
import { stickers } from '../elements/social-stickers/registry';
import { TemplatesPanel } from './templates/TemplatesPanel';
/** tpl-grid replaces the whole panel; without it (`?variant=baseline`, A/B sets) the v1 Layouts panel below renders. */
export function Layouts() {return hasVariant('tpl-grid')?<TemplatesPanel/>:<LayoutsV1/>;}
function LayoutsV1() {const {state,actions}=useEditor();const applyStyle=useApplyStyle();
  // With split points, a layout applies to the segment under the playhead (Thinh's plan: per-segment layout after split).
  const split=state.splitPoints.length>0;
  const segStart=[0,...state.splitPoints].filter(s=>s<=state.playhead).sort((a,b)=>b-a)[0]??0;
  const current=layoutAt(state.playhead,state.layoutId,state.splitPoints,state.segmentLayouts);
  const landscape=state.outputRatio==='16:9';
  const choose=(name:LayoutName)=>{
    if(name===current&&!landscape){actions.notify(name+' layout already selected');return}
    if(!split||landscape){actions.commit({layoutId:name,segmentLayouts:{},outputRatio:'9:16',toast:landscape?'Clip is now vertical (9:16)':''},'Change layout');return}
    actions.commit({segmentLayouts:{...state.segmentLayouts,[segmentKey(segStart)]:name},toast:name+' applied to this segment'},'Change segment layout');
  };
  // Claude improvement C4: your style first, then the layouts of your last exported clips, then every layout in a
  // fixed order. Recent is read once per panel open and never reordered by a pick; the selected tile is highlighted
  // wherever it appears.
  const kit=loadStyleKits()[0];const [recent]=useState(recentLayouts);
  const lv=layoutVariant(kit?.layout,recent[0]);
  const descriptions:Record<string,string>={'Split':'Facecam on top, game below','Circle facecam':'Game fills the screen with a round facecam','Small facecam':'Game fills the screen, small facecam','Fullscreen':'Game fills the screen, no facecam','Game UI':'Game fills the screen; facecam stays clear of game UI','Blurred':'Game fills the screen with a blurred background','Basecam':'Facecam fills the screen','Mosaic':'Game and facecam in a mosaic','Dual facecam':'Two facecams with gameplay','Duo Split':'Two facecams above gameplay','Half':'Game and facecam share the screen'};
  const groupDesc=hasVariant('lay-cam-desc');const tile=(name:LayoutName,i=-1)=><button key={name} className={'layout-tile '+(current===name?'selected':'')} onClick={()=>choose(name)}>{lv==='recent-first'&&i===0&&LAST_BADGE}<strong>{name}</strong><LayoutCanvas layout={name} thumbnail/>{hasVariant('layout-describe')&&<small className="layout-description">{(groupDesc?cameraDescriptions[name]:descriptions[name])||`${name} layout`}</small>}</button>;
  // C10: 8.2% of web projects keep horizontal footage at 16:9 and export at 41% vs 66% for 9:16 (5-22 Oct). A 16:9 clip
  // opens Layouts with one card that makes it vertical with the user's last layout; picking any tile does the same.
  const recentRow=(title:string)=>recent.length>0&&<Section title={title} action=""><TileGrid className="layout-grid recent-grid">{recent.map((n,i)=>tile(n,i))}</TileGrid></Section>;
  const vertical=recent[0]??'Split';
  const styleCard=kit&&!landscape&&<button className={'style-quickstart'+(lv?' sq-differs':'')} onClick={()=>applyStyle(kit)}><span className="sq-thumb"><LayoutCanvas layout={kit.layout} thumbnail/></span><span className="sq-copy"><small>{lv==='recent-first'?'Saved style · differs from your last clip':'Your style'}</small><strong>{kit.name}</strong><em>{kit.summary}</em></span><span className="sq-cta">Apply <Icon name="arrow-right" size={13}/></span></button>;
  const lastClip=lv==='style-lastclip'&&!landscape&&<LastClipLine last={recent[0]} onUse={()=>choose(recent[0])}/>;
  return <><PanelHeader title="Choose your layout" subtitle={landscape?'This clip is still 16:9. Pick a layout to make it vertical':split?(hasVariant('lay-part-picker')&&!landscape?`Applies to Part ${partIndex(state)}`:'Applies to the selected segment'):'Facecam and gameplay are placed for you; drag the boxes to adjust'}/>
    {hasVariant('layout-describe')&&<p className="layout-game-ui-note">Game UI keeps your facecam away from important game interface areas.</p>}
    {hasVariant('templates')&&<div className="quick-templates"><strong>Templates</strong><div>{[
      ['FPS highlight','Split','THE HOOK.','🔥'],['No facecam','Fullscreen','WORD','⚡'],['Streamer chat','Circle facecam','WORD','💬'],['Clean gameplay','Game UI','THE HOOK.','🎮']
    ].map(([name,layout,caption,sticker],index)=><button key={name} onClick={()=>{const kits=loadStyleKits();const kit=kits[index===2?1:0]||{id:'round2-'+index,name,summary:'Template preset',layout:layout as LayoutName,captionPreset:caption,captionFlavor:index===2?'comic':'hook',source:'demo' as const};const base=applyStyleKit({...kit,layout:layout as LayoutName,captionPreset:caption,captionFlavor:index===2?'comic':'hook'},state);const saved=stickers[index];const element={id:'template-'+Date.now(),kind:'element' as const,category:'Social Stickers',label:saved?.look||sticker,start:state.playhead,duration:5,style:{design:saved?.id||'twitch-follow',platform:saved?.platforms[0]||'Twitch',letterAnimation:'None',visualEffect:'None',inIntensity:50,inSpeed:75,outIntensity:50,outSpeed:75},preview:{x:38,y:45,width:24,height:12,opacity:100}};actions.commit({...base,elements:[...(base.elements||state.elements),element],toast:`${name} applied: ${layout}, ${caption} captions and a social sticker`},`Apply ${name}`);}}><span>{sticker}</span><b>{name}</b><small>{layout} · {caption} · sticker</small></button>)}</div></div>}
    {landscape&&<div className="make-vertical"><button className="style-quickstart" onClick={()=>choose(vertical)}><span className="sq-thumb"><LayoutCanvas layout={vertical} thumbnail/></span><span className="sq-copy"><small>Still 16:9</small><strong>Make it vertical</strong><em>{vertical} layout, your last one. TikTok, Shorts and Reels are 9:16.</em></span><span className="sq-cta">Make 9:16 <Icon name="arrow-right" size={13}/></span></button><button className="mv-keep" onClick={()=>actions.notify('Keeping 16:9. You can still pick a layout below')}>Keep 16:9 for YouTube</button></div>}
    {lv==='recent-first'&&!landscape&&recentRow('Your last clips')}
    {/* v1 settle (Thinh, 28 Oct): every way to reuse a look sits in one block: save this look, the saved style card,
        the last clip's layout. Without look-save or style-lastclip (?variant=baseline) the panel renders as before. */}
    {!landscape&&(hasVariant('look-save')||(hasVariant('style-lastclip')&&(styleCard||lastClip)))
      ?<section className="reuse-block" aria-label="Reuse a look"><div className="reuse-head"><h2>Reuse a look</h2>{hasVariant('look-save')&&<LookSaveAction state={state} compact/>}</div>{styleCard}{lastClip}</section>
      :<>{styleCard}{lastClip}</>}
    {hasVariant('lay-part-picker')&&split&&!landscape&&<PartPicker state={state}/>}
    {lv!=='recent-first'&&recentRow('Recently used')}
    {hasVariant('lay-cam-groups')?cameraGroups.map(g=><div key={g.title} className="camera-group"><Section title={g.title} action=""><p className="camera-group-line">{g.line}</p><TileGrid className="layout-grid">{g.layouts.map(n=>tile(n))}</TileGrid></Section></div>)
      :<Section title="All layouts" action=""><TileGrid className="layout-grid">{layoutNames.map(n=>tile(n))}</TileGrid></Section>}</>;}
