import { useState } from 'react';
import { cssVar } from '../../theme/css-var';
import type { CaptionStyle } from './model';

// Colours may be stored as token references (var(--x)); the field shows the actual colour value.
const shownColor = (value: unknown) => { const v = String(value || 'var(--text-1)'); const m = /^var\((--[\w-]+)\)$/.exec(v); return m ? cssVar(m[1], v) : v; };
export type StyleSetter = (key: string, value: string | number | boolean) => void;
function Slider({ title, name, style, set, min = 0, max = 100, fallback = 0, step = 1 }: { title: string; name: string; style: CaptionStyle; set: StyleSetter; min?: number; max?: number; fallback?: number; step?: number }) {
  return <label className="captions-mini-control">{title} <output>{Number(style[name] ?? fallback)}</output><input aria-label={title} type="range" min={min} max={max} step={step} value={Number(style[name] ?? fallback)} onChange={event => set(name, Number(event.target.value))} /></label>;
}
export function StyleFields({ style, set, configure = false }: { style: CaptionStyle; set: StyleSetter; configure?: boolean }) {
  const [open, setOpen] = useState(configure ? '' : 'Stroke');
  const effects = configure ? ['Fill', 'Stroke', 'Shadow', 'Glow', 'Background'] : ['Fill', 'Stroke', 'Add an extra stroke', 'Shadow', 'Glow', 'Background'];
  const field = (name: string) => configure ? 'highlight' + name[0].toUpperCase() + name.slice(1) : name;
  const keyOf = (item: string) => item === 'Fill' && configure ? 'highlightColor' : field(item === 'Add an extra stroke' ? 'extraStroke' : item.toLowerCase());
  return <div className="captions-style-card">
    {!configure && <><h4>TYPOGRAPHY</h4><label className="captions-font">Font<select aria-label="Caption font" value={String(style.font)} onChange={event => set('font', event.target.value)}>{['CaptionBangers', 'CaptionAnton', 'CaptionBebas', 'CaptionLuckiest', 'CaptionMontserrat', 'CaptionPoppins'].map(font => <option key={font} value={font}>{font === 'CaptionBangers' && style.presetFlavor === 'hook' ? 'KOMIKA AXIS' : font.replace('Caption', '')}</option>)}</select></label>
      <div className="captions-typography-actions"><button aria-pressed={style.weight === 800} onClick={() => set('weight', style.weight === 800 ? 400 : 800)}>Regular⌄</button><button aria-pressed={!!style.italic} onClick={() => set('italic', !style.italic)}>Italic</button><button aria-pressed={!!style.uppercase} onClick={() => set('uppercase', !style.uppercase)}>AA</button></div>
      <button className="captions-spacing" onClick={() => setOpen(open === 'Spacing' ? '' : 'Spacing')}>Spacing <span>relaxed / normal⌄</span></button>
      {open === 'Spacing' && <><Slider title="Letter spacing" name="spacing" style={style} set={set} max={10} /><Slider title="Line height" name="leading" style={style} set={set} min={.8} max={2} fallback={1.1} step={.1} /></>}
      <h4>COLORS &amp; EFFECTS</h4></>}
    {effects.map(item => { const key = keyOf(item); return <div key={item}>
      {/* Reference rows: swatch + name + gear when the property is set ("−" removes it), "+" when it is not. */}
      <div className="captions-style-row-wrap">{(() => { const has = item === 'Fill' || !!style[key]; return <><button className="captions-style-row" onClick={() => setOpen(open === item ? '' : item)}>{has && <i className="captions-row-swatch" style={{ background: String(style[key] || 'var(--text-1)') }} />}{item}<span aria-hidden="true">{has ? '⚙' : '+'}</span></button>{has && item !== 'Fill' && <button className="captions-row-remove" aria-label={`Remove ${item.toLowerCase()}`} onClick={() => { set(key, ''); setOpen(''); }}>−</button>}</>; })()}</div>
      {open === item && <div className="caption-effect-fields"><label className="captions-mini-control">{configure && item === 'Fill' ? 'Highlight color' : item + ' color'}<input aria-label={`${configure ? 'Highlight ' : ''}${item} color`} value={shownColor(style[key])} onChange={event => set(key, event.target.value)} /></label>
        <div className="caption-swatches">{['--text-1', '--bg-app', '--accent', '--art-ffff81', '--art-fa90df'].map(token => <button key={token} aria-label={`${item} ${token.replace('--', '')}`} style={{ background: `var(${token})` }} onClick={() => set(key, cssVar(token))} />)}<button onClick={() => set(key, 'transparent')}>Clear {item.toLowerCase()}</button></div>
        {item === 'Stroke' && <Slider title="Stroke width" name={field("strokeWidth")} style={style} set={set} max={8} fallback={2} />}
        {item === 'Add an extra stroke' && <Slider title="Extra stroke width" name={field("extraStrokeWidth")} style={style} set={set} max={12} fallback={3} />}
        {item === 'Shadow' && <><Slider title="Shadow horizontal offset" name={field("shadowX")} style={style} set={set} min={-15} max={15} fallback={2} /><Slider title="Shadow vertical offset" name={field("shadowY")} style={style} set={set} min={-15} max={15} fallback={3} /><Slider title="Shadow blur" name={field("shadowBlur")} style={style} set={set} max={30} fallback={3} /></>}
        {item === 'Glow' && <Slider title="Glow radius" name={field("glowRadius")} style={style} set={set} max={40} fallback={12} />}
        {item === 'Background' && <Slider title="Background radius" name={field("backgroundRadius")} style={style} set={set} max={40} fallback={4} />}
        <Slider title={configure ? "Highlight opacity" : "Caption opacity"} name={field("opacity")} style={style} set={set} fallback={100} />
      </div>}
    </div>; })}
  </div>;
}
