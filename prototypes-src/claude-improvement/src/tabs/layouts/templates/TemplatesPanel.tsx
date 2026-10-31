import { activeScenario } from '../../../start/scenarios';
import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../../../state';
import { PanelHeader } from '../../../shell/PanelHeader';
import { LayoutCanvas } from '../../../shell/LayoutCanvas';
import { Icon } from '../../../ui/Icon';
import { applyStyleKit } from '../../export/style-kits';
import { cameraCount, deleteTemplate, loadFilter, myTemplates, presets, renameTemplate, saveCurrentAsTemplate, saveFilter, touchTemplate, type Filter, type Template } from './my-templates';
import './templates.css';

const chips: [Filter, string][] = [['all', 'All'], ['saved', '★ Saved'], ['0', 'No camera'], ['1', 'One camera'], ['2', 'Two cameras']];

/** Template thumbnail: the real layout plus the template's caption text and its social sticker. */
function Thumb({ t }: { t: Template }) {
  return <span className="tpl-thumb"><LayoutCanvas layout={t.layout} thumbnail/><i className="tpl-sticker"/>{t.caption && <i className="tpl-caption">{t.caption}</i>}</span>;
}

/** tpl-grid: the Layouts tab as "Templates" (design-drafts/261029-templates-menu, variant C2). One grid: save card,
 *  your templates (last used first), then the Eklipse templates; chips filter by kind and camera count. */
export function TemplatesPanel() {
  const { state, actions } = useEditor();
  const [, refresh] = useState(0);
  const mine = myTemplates();
  const [filter, setFilterState] = useState<Filter>(() => { const f = loadFilter(); return f === 'saved' && !mine.length ? 'all' : f; });
  const [applied, setApplied] = useState<string | null>(null);
  // Start from app: the template picked on app.eklipse.gg stays named here until another template is applied.
  const [fromApp] = useState(activeScenario);
  const [menu, setMenu] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ text: string; run: () => void } | null>(null);
  const timer = useRef(0);
  useEffect(() => { const r = () => refresh(n => n + 1); window.addEventListener('storage', r); return () => window.removeEventListener('storage', r); }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const parts = state.splitPoints.length + 1;
  const landscape = state.outputRatio === '16:9';
  const setFilter = (f: Filter) => { setFilterState(f); saveFilter(f); setMenu(null); };
  const showUndo = (text: string, run: () => void) => { clearTimeout(timer.current); setUndo({ text, run }); timer.current = window.setTimeout(() => setUndo(null), 6000); };

  // Every template applies to the whole clip: per-part layouts are replaced, a 16:9 clip becomes 9:16. ⌘Z undoes it.
  const apply = (t: Template) => {
    setMenu(null);
    const where = parts > 1 ? ` to all ${parts} parts` : landscape ? ', now 9:16' : '';
    actions.commit({ ...applyStyleKit(t.kit, state), layoutId: t.layout, segmentLayouts: {}, outputRatio: '9:16', toast: `${t.name} applied${where} · ⌘Z to undo` }, 'Apply template ' + t.name);
    if (t.saved) touchTemplate(t.id);
    setApplied(t.id);
  };
  const save = () => {
    const first = !mine.length;
    try { const id = saveCurrentAsTemplate(state); setApplied(id); setRenaming(id); if (filter !== 'saved') setFilter('all'); actions.notify(first ? 'Saved. It’s here for your next clips.' : 'Saved as a template'); }
    catch { actions.notify('Could not save this template locally'); }
  };
  const rename = (id: string, value: string, cancel = false) => {
    setRenaming(null);
    if (cancel) return;
    const nid = renameTemplate(id, value);
    if (applied === id) setApplied(nid);
  };
  const remove = (t: Template) => { setMenu(null); const restore = deleteTemplate(t.id); if (applied === t.id) setApplied(null); showUndo(`${t.name} deleted`, restore); };

  const byCamera = (t: Template) => filter === 'all' || filter === 'saved' || String(cameraCount(t.layout)) === filter;
  const shownMine = mine.filter(byCamera), shownPresets = filter === 'saved' ? [] : presets.filter(byCamera);
  const showIntro = !mine.length && (filter === 'all' || filter === 'saved');
  const showSave = !!mine.length && (filter === 'all' || filter === 'saved');

  const card = (t: Template, i: number) => <div key={t.id} className={'tpl-card' + (applied === t.id ? ' selected' : '')} role="button" tabIndex={0} aria-label={'Apply ' + t.name}
    onClick={e => { if (!(e.target as HTMLElement).closest('.tpl-more,.tpl-menu,input')) apply(t); }}
    onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); apply(t); } }}>
    <Thumb t={t}/>
    <span className="tpl-tag">★ {i === 0 ? 'Last used' : 'Saved'}</span>
    <button className="tpl-more" aria-label={'More for ' + t.name} aria-expanded={menu === t.id} onClick={() => setMenu(menu === t.id ? null : t.id)}><Icon name="more" size={14}/></button>
    {menu === t.id && <div className="tpl-menu" role="menu"><button role="menuitem" onClick={() => { setMenu(null); setRenaming(t.id); }}>Rename</button><button role="menuitem" className="danger" onClick={() => remove(t)}>Delete</button></div>}
    {renaming === t.id
      ? <input className="tpl-name-input" defaultValue={t.name} maxLength={40} aria-label="Template name" autoFocus onFocus={e => e.currentTarget.select()}
          onKeyDown={e => { if (e.key === 'Enter') rename(t.id, e.currentTarget.value); if (e.key === 'Escape') rename(t.id, '', true); }}
          onBlur={e => renaming === t.id && rename(t.id, e.currentTarget.value)}/>
      : <strong>{t.name}</strong>}
    <small>{t.layout} · {t.summary}</small>
  </div>;

  return <>
    <PanelHeader title="Templates" subtitle="Layout, caption style and social sticker in one click"/>
    {fromApp && !applied && <div className="tpl-inuse" role="status"><span className="tpl-inuse-tag">In use</span><div><strong>{fromApp.template}</strong><small>Picked on app.eklipse.gg · {[fromApp.layout, fromApp.captionPreset && fromApp.captionPreset + ' captions', fromApp.channel && 'channel name'].filter(Boolean).join(' · ')}</small></div></div>}
    {parts > 1 && <p className="tpl-banner">Your clip has <b>{parts} parts</b>. Templates apply to the whole clip.</p>}
    {landscape && <p className="tpl-banner">This clip is still <b>16:9</b>. Any template makes it vertical.<button className="tpl-link" onClick={() => actions.notify('Keeping 16:9 for YouTube. Templates will make it vertical.')}>Keep 16:9</button></p>}
    <div className="tpl-chips" role="tablist" aria-label="Filter templates">{chips.map(([f, label]) => <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{label}{f === 'saved' && <em>{mine.length}</em>}</button>)}</div>
    {undo && <p className="tpl-undo" role="status"><span>{undo.text}</span><button className="tpl-link" onClick={() => { undo.run(); setUndo(null); }}>Undo</button></p>}
    <div className="tpl-grid">
      {showIntro && <div className="tpl-intro">
        <div className="tpl-fan" aria-hidden="true">{['Split', 'Circle facecam', 'Game UI'].map(l => <Thumb key={l} t={presets.find(p => p.layout === l)!}/>)}<span className="tpl-plus"><Icon name="plus" size={16}/></span></div>
        <div><h3>Make your own template</h3><p>Set up this clip the way you like it: layout, captions, sticker, sounds. Save it once and it’s one click on every next clip.</p>
          <div className="tpl-intro-actions"><button className="tpl-primary" onClick={save}>＋ Save this edit as a template</button>{filter === 'saved' ? <button className="tpl-link" onClick={() => setFilter('all')}>Browse Eklipse templates</button> : <span>or start from an Eklipse template below</span>}</div></div>
      </div>}
      {showSave && <button className="tpl-save" onClick={save}><Icon name="plus" size={20}/>Save this edit as a template</button>}
      {shownMine.map(t => card(t, mine.indexOf(t)))}
      {shownPresets.length > 0 && (shownMine.length > 0 || showSave || showIntro) && <p className="tpl-divider">Eklipse templates · layout, caption style and sticker</p>}
      {shownPresets.map(t => <button key={t.id} className={'tpl-card' + (applied === t.id ? ' selected' : '')} onClick={() => apply(t)}><Thumb t={t}/><strong>{t.name}</strong><small>{t.summary}</small></button>)}
    </div>
  </>;
}
