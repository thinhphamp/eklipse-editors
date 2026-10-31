import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useEditor } from '../../state';
import { hasVariant } from '../../variant';
import { Icon } from '../../ui/Icon';
import './preview-strip.css';

// pv-strip (Quan, 30 Oct): safe zone + preview zoom leave the top-right corner for a small icon strip hugging the
// player's right edge, plus a quiet "TikTok safe zone" tag above the player (design-drafts/261030-preview-controls, C).
export const ZONES = [['No safe zones', 'Off'], ['YouTube preview', 'YouTube'], ['TikTok preview', 'TikTok'], ['Instagram preview', 'Instagram']] as const;
const LEVELS = [25, 33, 50, 75, 100, 125, 150, 175, 200];
const FIT_FALLBACK = 65.6;

/** Strip is on for the promoted design; legacy x-routes keep the old selects. */
export const useStripOn = () => { const { state } = useEditor(); return hasVariant('pv-strip') && !state.routeId.startsWith('x'); };
/** The real zoom of "Fit": read from the state label "Fit (65.6%)". */
export const fitPercent = (zoom: string) => Number.parseFloat(/\(([\d.]+)%\)/.exec(zoom)?.[1] ?? '') || FIT_FALLBACK;
export const zoomPercent = (zoom: string, fit: number) => zoom.startsWith('Fit') ? fit : Number.parseInt(zoom, 10);
/** Scale of the zoom shell relative to Fit (1 = Fit). */
export const previewScale = (zoom: string) => zoom.startsWith('Fit') ? 1 : Number.parseInt(zoom, 10) / fitPercent(zoom);

/** Keeps a strip/tag glued to the zoomed phone's edge (the shell scales from its top centre), clamped inside the stage. */
function usePinToPhone(ref: RefObject<HTMLElement|null>, scale: number, side: 'right'|'left') {
  useLayoutEffect(() => {
    const el = ref.current, anchor = el?.parentElement, stage = el?.closest<HTMLElement>('.stage');
    if (!el || !anchor || !stage) return;
    const place = () => {
      const a = anchor.getBoundingClientRect(), st = stage.getBoundingClientRect(), half = a.width / 2, grow = half * scale;
      el.style.left = (side === 'right'
        ? Math.min(half + grow + 10, st.right - a.left - el.offsetWidth - 8)
        : Math.max(half - grow + 2, st.left - a.left + 8)) + 'px';
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(stage); observer.observe(anchor);
    return () => observer.disconnect();
  }, [ref, scale, side]);
}
export const zoneShort = (zone: string) => ZONES.find(z => z[0] === zone)?.[1] ?? zone;

const SafeIcon = () => <svg className="ui-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="1.5" width="10" height="13" rx="2"/><rect x="5" y="4" width="6" height="7" rx=".5" strokeDasharray="1.6 1.4"/></svg>;
const FitIcon = () => <svg className="ui-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/></svg>;

export function PreviewStrip() {
  const { state, actions } = useEditor();
  const [menu, setMenu] = useState<'zone'|'zoom'|null>(null);
  const ref = useRef<HTMLDivElement>(null);
  usePinToPhone(ref, previewScale(state.zoom), 'right');
  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [menu]);
  const fit = fitPercent(state.zoom), pct = zoomPercent(state.zoom, fit);
  const fitLabel = 'Fit (' + fit + '%)';
  const step = (dir: 1|-1) => {
    const next = dir > 0 ? LEVELS.find(v => v > pct + .5) : [...LEVELS].reverse().find(v => v < pct - .5);
    if (next) actions.patch({ zoom: next + '%' });
  };
  const zoneOn = state.safeZone !== 'No safe zones', wide = state.outputRatio === '16:9';
  return <div className="pv-strip" ref={ref} role="toolbar" aria-label="Preview" aria-orientation="vertical">
    {!wide && <>
      <button className={zoneOn ? 'on' : ''} title={'Safe zone: ' + zoneShort(state.safeZone)} aria-haspopup="menu" aria-expanded={menu === 'zone'} onClick={() => setMenu(menu === 'zone' ? null : 'zone')}><SafeIcon/></button>
      <span className="pv-sep"/>
    </>}
    <button title="Zoom in" aria-label="Zoom in" disabled={pct >= 199.5} onClick={() => step(1)}><Icon name="plus" size={16}/></button>
    <button className="pv-pct" title="Preview zoom" aria-label={'Preview zoom ' + Math.round(pct) + '%'} aria-haspopup="menu" aria-expanded={menu === 'zoom'} onClick={() => setMenu(menu === 'zoom' ? null : 'zoom')}>{Math.round(pct)}%</button>
    <button title="Zoom out" aria-label="Zoom out" disabled={pct <= 25.5} onClick={() => step(-1)}><Icon name="minus" size={16}/></button>
    <button title="Fit to window" aria-label="Fit to window" className={state.zoom.startsWith('Fit') ? 'on-quiet' : ''} onClick={() => actions.patch({ zoom: fitLabel })}><FitIcon/></button>
    {menu === 'zone' && <div className="pv-menu" role="menu">
      {ZONES.map(([zone], i) => <div key={zone}>{i === 1 && <hr/>}<button role="menuitemradio" aria-checked={state.safeZone === zone} onClick={() => { actions.patch({ safeZone: zone }); setMenu(null); }}><span className="pv-check">{state.safeZone === zone && <Icon name="check" size={14}/>}</span>{zone}</button></div>)}
    </div>}
    {menu === 'zoom' && <div className="pv-menu pv-menu-zoom" role="menu">
      <button role="menuitemradio" aria-checked={state.zoom.startsWith('Fit')} onClick={() => { actions.patch({ zoom: fitLabel }); setMenu(null); }}><span className="pv-check">{state.zoom.startsWith('Fit') && <Icon name="check" size={14}/>}</span>Fit to window · {Math.round(fit)}%</button>
      <hr/>
      {[...LEVELS].reverse().map(v => <button key={v} role="menuitemradio" aria-checked={state.zoom === v + '%'} onClick={() => { actions.patch({ zoom: v + '%' }); setMenu(null); }}><span className="pv-check">{state.zoom === v + '%' && <Icon name="check" size={14}/>}</span>{v}%</button>)}
    </div>}
  </div>;
}

/** Quiet tag above the player naming the active safe zone (hidden when off or 16:9). */
export function SafeZoneTag() {
  const { state } = useEditor();
  const ref = useRef<HTMLSpanElement>(null);
  usePinToPhone(ref, previewScale(state.zoom), 'left');
  if (state.safeZone === 'No safe zones' || state.outputRatio === '16:9') return null;
  return <span className="pv-tag" ref={ref}><i/>{zoneShort(state.safeZone)} safe zone</span>;
}
