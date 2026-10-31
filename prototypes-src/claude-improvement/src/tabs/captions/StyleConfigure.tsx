import { animationTiles } from './catalog';
import { useEditor } from '../../state';
import { motionNames } from './render-style';
import type { CaptionStyle } from './model';
import { StyleFields, type StyleSetter } from './StyleFields';
export function Switch({ checked }: { checked: boolean }) { return <span className={`captions-switch ${checked ? 'on' : ''}`}><i /></span>; }
export function Segmented({ items, value, set }: { items: string[]; value: string; set: (value: string) => void }) {
  const { actions } = useEditor(); return <div className="captions-segmented">{items.map(item => <button key={item} className={value === item ? 'active' : ''} onClick={() => { if (item === value) actions.notify(`${item} is already selected`); set(item); }}>{item}</button>)}</div>;
}
export function AnimationGrid({ style, set, compact = false }: { style: CaptionStyle; set: StyleSetter; compact?: boolean }) {
  const { actions } = useEditor(); const choice = String(style.animation);
  return <div className={`captions-animation-grid ${compact ? 'compact' : ''}`}>{animationTiles.map(([name, sample, label]) => <button key={name} className={choice === name ? 'selected' : ''} onClick={() => {
    if (choice === name) actions.notify(`${name} is already selected`); set('animation', name);
  }}><strong>{sample}</strong><small>{label}</small></button>)}</div>;
}
export function StyleConfigure({ style, set, settings, setEffect }: { style: CaptionStyle; set: StyleSetter; settings: Record<string, boolean>; setEffect: (name: string, value: boolean) => void }) {
  const { actions, state } = useEditor();
  return <><div className="captions-config-card"><b>Layout</b><small>Choose how captions are sized and grouped on screen.</small>
    {state.routeId === 'x19' && <div className="captions-config-label">Show as <Segmented items={['Word', 'Sentence']} value={String(style.showAs || 'Sentence')} set={value => set('showAs', value)} /></div>}
    <button className="captions-config-toggle" onClick={() => set('breakLines', style.breakLines === false)}>Break lines <Switch checked={style.breakLines !== false} /></button>
    <div className="captions-config-label">Caption length</div><Segmented items={['Short', 'Medium', 'Long']} value={Number(style.maxChars) < 25 ? 'Short' : Number(style.maxChars) > 40 ? 'Long' : 'Medium'} set={value => set('maxChars', value === 'Short' ? 15 : value === 'Long' ? 50 : 35)} />
  </div><div className="captions-config-card"><b>Highlight spoken word</b><small>Automatically highlight the current spoken word in your captions.</small><div className="captions-highlight-grid">{['None', 'Color', 'Underline', 'Pill'].map(item => <button key={item} className={style.highlight === item ? 'active' : ''} onClick={() => { if (style.highlight === item) actions.notify(`${item} highlight is already selected`); set('highlight', item); }}><strong>{item === 'None' ? '×' : item === 'Color' ? 'Catch the word' : item === 'Underline' ? 'The secret is in' : 'Watch the spotlight'}</strong><small>{item}</small></button>)}</div><StyleFields style={style} set={set} configure /></div>
  <div className="captions-config-card"><b>Animation</b><Segmented items={['Word animations', 'Sentence animations']} value={String(style.animationTarget || 'Word animations')} set={value => set('animationTarget', value)} /><AnimationGrid style={style} set={set} compact />
    <label>Entrance<select aria-label="Caption entrance animation" value={motionNames.includes(String(style.animation)) ? String(style.animation) : 'none'} onChange={event => set('animation', event.target.value)}>{motionNames.map(name => <option key={name}>{name}</option>)}</select></label>
  </div><div className="captions-config-card"><b>Visual effects</b>{['AI Shake', 'AI Supersize', 'Hide Punctuation', 'Random rotation'].map(name => <button key={name} className="captions-config-toggle" onClick={() => setEffect(name, !settings[name])}>{name}<Switch checked={!!settings[name]} /></button>)}</div></>;
}
