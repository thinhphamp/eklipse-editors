import React, { Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Tab } from './data';
import { EditorProvider, useEditor } from './state';
import { Rail } from './shell/Rail';
import { Preview } from './shell/Preview';
import { Playback } from './shell/Playback';
import { Timeline } from './shell/Timeline';
import { TimelineResizer } from './shell/TimelineResizer';
import { TopBar } from './shell/TopBar';
import { AiReview } from './shell/AiReview';
import { Toast } from './ui/Toast';
import { TooltipLayer } from './ui/TooltipLayer';
import { UploadDialog } from './shell/UploadDialog';
import { Overview } from './shell/Overview';
import { useUndoShortcuts } from './shell/use-undo-shortcuts';
import { UpsellDialog } from './ui/premium';
import './theme/tokens.css';
import { applyTheme, currentTheme } from './theme/theme';
import './theme/base-controls.css';
import './styles.css';
import { Icon } from './ui/Icon';
import './shell/preview.css';
import './shell/timeline.css';
import { getEngine } from './engine/playback-engine';
import { usePlaybackBridge } from './engine/use-playback';
import { hasVariant } from './variant';
import { ExportReady, QuickAdd } from './round2';
import { activeScenario, isStartFromApp } from './start/scenarios';
import { StartBoot } from './start/StartBoot';
import { setBootPhase, getBootPhase } from './start/boot-phase';
import { StartPicker } from './start/StartPicker';
import { useStripOn } from './shell/preview-strip/PreviewStrip';
import { CaptionJobBridge } from './tabs/captions/d1/CaptionJobBridge';

// One chunk per tab: only the open panel's code is loaded.
const panels: Record<Tab, React.LazyExoticComponent<() => React.ReactNode>> = {
  Layouts: lazy(() => import('./tabs/layouts/Layouts').then(m => ({ default: m.Layouts }))),
  Elements: lazy(() => import('./tabs/elements/Elements').then(m => ({ default: m.Elements }))),
  Effects: lazy(() => import('./tabs/effects/Effects').then(m => ({ default: m.Effects }))),
  Audio: lazy(() => import('./tabs/audio/Audio').then(m => ({ default: m.Audio }))),
  Captions: lazy(() => import('./tabs/captions/Captions').then(m => ({ default: m.Captions }))),
  Socials: lazy(() => hasVariant('ch-stickers') ? import('./tabs/channel/ChannelStickers').then(m => ({ default: m.ChannelStickers })) : import('./tabs/elements/variants/social/Socials').then(m => ({ default: m.Socials }))),
  Export: lazy(() => import('./tabs/export/Export').then(m => ({ default: m.Export }))),
};
const TemplateDialog = lazy(() => import('./tabs/export/Export').then(m => ({ default: m.TemplateDialog })));
const ExportDialog = lazy(() => import('./tabs/export/Export').then(m => ({ default: m.ExportDialog })));

function Editor() {
  const { state, actions } = useEditor();
  const [scenario] = useState(activeScenario);
  const Panel = panels[state.activeTab];
  const [zoomOpen,setZoomOpen]=useState(false);
  const strip=useStripOn();
  useUndoShortcuts();
  usePlaybackBridge();

  useEffect(() => {
    if (!new URLSearchParams(location.search).has('verify')) return;
    (window as Window & { __verify?: unknown }).__verify = { state, actions, engine: getEngine(), get bootPhase() { return getBootPhase(); }, scenario: scenario ? scenario.id : null };
    return () => { delete (window as Window & { __verify?: unknown }).__verify; };
  }, [state, actions]);
  if (isStartFromApp() && !scenario) return <StartPicker />;
  if (state.overview) return <Overview />;
  return <div className={'app-shell screen-'+state.routeId.toLowerCase()+' '+(state.routeId.startsWith('x')?'legacy':'')} aria-label="Eklipse editor prototype">
    <Rail />
    <aside className={'side-panel'+(state.panelCollapsed?' collapsed':'')} aria-hidden={state.panelCollapsed}><div className="panel-scroll"><Suspense fallback={null}><Panel /></Suspense></div></aside>
    <main className="editor-main"><TopBar />{hasVariant('quick-add')&&<QuickAdd/>}<AiReview />{hasVariant('export-ready')&&<ExportReady/>}
      <div className="stage-tools">{state.panelCollapsed&&<button className="panel-expand" title="Expand panel" aria-label="Expand panel" onClick={()=>actions.patch({panelCollapsed:false})}><Icon name="collapse" size={19}/></button>}{state.screenId==='T01'&&<span className="undo-tooltip">Undo “Change caption style” ⌘ Z</span>}<div className="stage-selects">{state.activeTab !== 'Layouts' && !strip && <><select aria-label="Safe zone preview" value={state.safeZone} onChange={e => actions.patch({safeZone:e.target.value})}><option>No safe zones</option><option>YouTube preview</option><option>TikTok preview</option><option>Instagram preview</option></select><div className="preview-zoom-control"><button aria-label="Preview zoom" aria-expanded={zoomOpen} onClick={()=>setZoomOpen(!zoomOpen)}>{state.zoom.startsWith("Fit") ? "33%" : state.zoom} &nbsp;⌄</button>{zoomOpen&&<div className="preview-zoom-menu">{["Fit to window","200%","175%","150%","125%","100%","75%","50%","33%","25%"].map(option=><button key={option} className={state.zoom===option?"selected":""} onClick={()=>{actions.patch({zoom:option});setZoomOpen(false)}}>{option}</button>)}</div>}</div></>}</div></div>
      <Preview /><Playback /><TimelineResizer /><Timeline />
    </main>
    <Toast />
    {hasVariant('cap-d1') && <CaptionJobBridge />}
    {scenario && <StartBoot scenario={scenario} />}
    {state.modal === 'template' && <Suspense fallback={null}><TemplateDialog /></Suspense>}
    {state.modal === 'upload' && <UploadDialog />}
    {state.modal === 'upsell' && <UpsellDialog />}
    {state.modal === 'export' && <Suspense fallback={null}><ExportDialog /></Suspense>}
  </div>;
}
applyTheme(currentTheme());
if (activeScenario()) setBootPhase('loading');
createRoot(document.getElementById('root')!).render(<React.StrictMode><EditorProvider><Editor /><TooltipLayer /></EditorProvider></React.StrictMode>);
