import { useEditor } from '../../state';
import { qualityChoices, templateFields } from '../../data';
import { PanelHeader } from '../../shell/PanelHeader';
import { ToggleRow } from '../../ui/ToggleRow';
import { LayoutCanvas } from '../../shell/LayoutCanvas';
import { Icon } from '../../ui/Icon';
import { useEffect, useState } from 'react';
import { ExportFlow } from './ExportFlow';
import { usePremium } from '../../ui/premium';
import { loadTemplates, saveTemplate, applyTemplate } from './template-store';
const rememberQuality=(id:string)=>{try{localStorage.setItem('ek-claude-quality',id)}catch{/* private mode */}};

// Claude improvement C7: Export opens as a dialog from the top bar or finish bar, on any tab.
export function ExportDialog(){const {actions}=useEditor();useEffect(()=>{const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')actions.patch({modal:''})};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc)},[actions]);return <div className="modal-shade" onMouseDown={()=>actions.patch({modal:''})}><div className="export-dialog-claude" role="dialog" aria-modal="true" aria-label="Export" onMouseDown={e=>e.stopPropagation()}><button className="dialog-x" aria-label="Close" onClick={()=>actions.patch({modal:''})}><Icon name="close" size={18}/></button><Export/></div></div>}

export function Export() {const {state,actions}=useEditor();const premium=usePremium();const [exporting,setExporting]=useState(false);const fileName='Eklipse clip';const watermark=false;const [templates,setTemplates]=useState(loadTemplates);useEffect(()=>{const show=()=>setExporting(true);const refresh=()=>{setTemplates(loadTemplates())};window.addEventListener('start-export',show);window.addEventListener('storage',refresh);return()=>{window.removeEventListener('start-export',show);window.removeEventListener('storage',refresh)}},[]);return <>
  <PanelHeader title="Select your quality" subtitle="Choose the quality of your video from the options below, then click the button to start rendering."/>
  <div className="quality-options">{qualityChoices.map(option=><button key={option.id} className={'quality-option '+(state.quality===option.id?'selected':'')} onClick={()=>state.quality===option.id?actions.notify(option.name+' already selected'):(option.id!=='720p30'&&!premium.require(option.resolution.includes('4K')?'4k':option.fps.includes('60')?'60fps':'1080p'))?undefined:(rememberQuality(option.id),actions.commit({quality:option.id},'Choose export quality'))}><span className="radio"/><span className="quality-res"><strong>{option.resolution}</strong><small>{option.fps}</small></span><span className="quality-copy"><strong>{option.name}</strong><small>{option.description}</small></span>{option.id!=='720p30' && <span className="diamond" title="Premium"><Icon name="crown" size={20}/></span>}</button>)}<div className="quality-banner">The ultimate quality for maximum impact! 🎉</div></div>
  <div className="export-actions-claude"><button className="export-primary" onClick={()=>setExporting(true)}><span>Export clip</span><Icon name="upload" size={19}/></button><button className="export-post" title="Claude improvement C7" onClick={()=>{setExporting(true);actions.notify('Export & post: the Publish page opens with render progress (prototype)')}}><span>Export &amp; post</span><Icon name="arrow-right" size={17}/></button></div><p className="export-remembered">We keep your last quality for the next clip.</p>
  <div className="export-divider"/>
  <h2 className="save-title">Save Template</h2>
  <p className="save-description">Save your current settings, crops and stickers as a template to save time on your next video.</p>
  <ul className="save-list"><li>Save your current clip settings as a reusable template.</li><li>Instantly apply the template to future clip projects with a single click.</li><li>Preserve edits, customizations, and effects for consistent and efficient results.</li></ul>
  <button className="save-template-button" onClick={()=>{if(premium.require('save-template'))actions.commit({modal:'template',templateName:state.layoutId,toast:'Opening template options'},'Name template')}}><Icon name="save" size={16}/> Save template</button>
  {templates.length>0&&<div className="saved-templates"><h3>Saved templates</h3>{templates.map((t,i)=><button key={i} onClick={()=>{actions.commit({...applyTemplate(t,state),templateFields:t.fields},'Apply template '+t.name)}}>{t.name}</button>)}</div>}{exporting&&<ExportFlow name={fileName} watermark={watermark} onClose={()=>setExporting(false)}/>}
  </>;}

export function TemplateDialog() {const {state,actions}=useEditor();const premium=usePremium();return <div className="modal-shade" onMouseDown={()=>actions.patch({modal:''})}><div className="template-dialog" role="dialog" aria-modal="true" aria-label="Save template" onMouseDown={e=>e.stopPropagation()}>
  <button className="dialog-x" aria-label="Close" onClick={()=>actions.patch({modal:''})}><Icon name="close" size={18}/></button>
  <div className="template-form"><h2>Save template</h2><p>Save this template to easily apply it to your next clip.</p><label className="template-name">Template name<input value={state.templateName} maxLength={50} onChange={e=>actions.commit({templateName:e.target.value},'Name template')}/><small>{state.templateName.length} / 50</small></label><h3>Save template with</h3><div className="template-field-list">{templateFields.map(field=><ToggleRow key={field} label={field} value={state.templateFields[field]??false} onChange={value=>actions.commit({templateFields:{...state.templateFields,[field]:value}},'Choose template fields')}/>)}</div><div className="template-actions"><button onClick={()=>actions.patch({modal:''})}>Close</button><button onClick={()=>{if(!premium.require('save-template'))return;actions.patch({modal:''});(()=>{try{saveTemplate(state);actions.notify('Template saved')}catch{actions.notify('Could not save template locally')}})()}}>Save</button></div></div>
  <div className="template-preview"><div className="phone-preview compact"><LayoutCanvas layout={state.templateName==='Circle facecam'?'Circle facecam':'Split'} second={18}/><div className="template-text">Nice shot<br/>Insane<br/>clutch play</div></div></div>
  </div></div>;}
