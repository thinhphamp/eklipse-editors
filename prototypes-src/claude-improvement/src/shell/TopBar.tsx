import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../state';
import { Icon } from '../ui/Icon';
import { applyStyleKit, type StyleKit } from '../tabs/export/style-kits';
import { claudeChanges } from './claude-changes';
import { applyTemplate, loadTemplates } from '../tabs/export/template-store';
import { initialState } from '../state/initial-state';
import { applyTheme, currentTheme, themes, type ThemeId } from '../theme/theme';
import './topbar.css';

// Claude improvement C1: one top bar for project-level actions. Undo/Redo, save state and Export (My styles removed 30 Oct)
// stay in the same place on every tab, so Export is never a rail tab or the last step of a wizard.
export function useApplyStyle() {
  const { state, actions } = useEditor();
  return (kit: StyleKit) => actions.commit({ ...applyStyleKit(kit, state), toast: `Style “${kit.name}” applied · ⌘Z to undo` }, 'Apply style ' + kit.name);
}

function ChangesPanel({ onClose }: { onClose: () => void }) {
  return <div className="tb-menu changes-menu" role="dialog" aria-label="What changed in this version">
    <p className="tb-menu-title">Claude improvement: what changed vs the StreamLadder-parity prototype</p>
    <ol>{claudeChanges.map(c => <li key={c.id}><b>{c.id}</b> {c.title}<small>{c.why}</small></li>)}</ol>
    <button onClick={onClose}>Close</button>
  </div>;
}

function ThemeMenu({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState<ThemeId>(currentTheme);
  const pick = (id: ThemeId) => { applyTheme(id, true); setActive(id); };
  return <div className="tb-menu theme-menu" role="menu" aria-label="Appearance">
    <p className="tb-menu-title">Appearance</p>
    {(['Dark', 'Light'] as const).map(group => <div key={group} className="theme-group">
      <span className="theme-group-label">{group}</span>
      {themes.filter(t => (t.id === 'light' || t.id === 'lavender') === (group === 'Light')).map(t =>
        <button key={t.id} role="menuitemradio" aria-checked={active === t.id} className={active === t.id ? 'selected' : ''} onClick={() => pick(t.id)}>
          <span className="theme-swatch" data-swatch={t.id} aria-hidden="true"><i /><i /><i /></span>
          <span className="theme-copy"><strong>{t.name}</strong><small>{t.note}</small></span>
          {active === t.id && <Icon name="check" size={14} />}
        </button>)}
    </div>)}
    <button className="theme-done" onClick={onClose}>Done</button>
  </div>;
}

function ThemeGlyph() {
  return <svg className="ui-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" /></svg>;
}

export function TopBar() {
  const { state, actions } = useEditor();
  const [menu, setMenu] = useState<'' | 'changes' | 'theme'>('');
  const isProbe = new URLSearchParams(location.search).has('verify');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!menu) return; const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(''); }; window.addEventListener('mousedown', close); return () => window.removeEventListener('mousedown', close); }, [menu]);
  return <div className="topbar" ref={ref}>
    <div className="tb-left">
      <span className="tb-title" title="Project name">Valorant clutch · 1:00</span>
      <span className="tb-saved" title="Changes save automatically"><Icon name="check" size={13} /> Saved</span>
      <div className="tb-history">
        <button title={state.undoLabel ? `Undo “${state.undoLabel}”` : 'Undo'} aria-label="Undo" data-keys="⌘ Z" onClick={actions.undo}><Icon name="undo" size={16} /></button>
        <button title={state.redoLabel ? `Redo “${state.redoLabel}”` : 'Redo'} aria-label="Redo" data-keys="⌘ ⇧ Z|⌘ Y" onClick={actions.redo}><Icon name="redo" size={16} /></button>
      </div>
    </div>
    <div className="tb-right">
      {new URLSearchParams(location.search).get('clip') === 'vertical-upload' && <button className="tb-secondary" onClick={() => actions.patch({ modal: 'upload' })}>Upload</button>}
      {new URLSearchParams(location.search).get('clip') === 'two-clips' && state.clipIndex !== 2 && <button className="tb-secondary" onClick={() => { const saved=loadTemplates().at(-1); const fresh=initialState(); const applied=saved?applyTemplate(saved,fresh):{}; actions.commit({...fresh,...applied,clipIndex:2,savedCaptionPreset:saved?.project.captions?.preset,exported:false,activeTab:'Layouts',modal:'',toast:saved?'Next clip opened · saved style applied':'Next clip opened'},'Open next clip with saved style'); }}>Next clip</button>}
      {!isProbe && <button className="tb-ghost" aria-expanded={menu === 'changes'} onClick={() => setMenu(menu === 'changes' ? '' : 'changes')}>What changed</button>}
      {!isProbe && <button className="tb-icon" title="Appearance" aria-label="Appearance" aria-expanded={menu === 'theme'} onClick={() => setMenu(menu === 'theme' ? '' : 'theme')}><ThemeGlyph /></button>}
      <button className="tb-primary" data-keys="⌘ E" onClick={() => actions.patch({ modal: 'export' })}><Icon name="upload" size={15} /> Export</button>
    </div>
    {!isProbe && menu === 'theme' && <ThemeMenu onClose={() => setMenu('')} />}
    {!isProbe && menu === 'changes' && <ChangesPanel onClose={() => setMenu('')} />}
  </div>;
}
