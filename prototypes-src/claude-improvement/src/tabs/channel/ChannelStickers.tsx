import { useEffect, useState } from 'react';
import { PanelHeader } from '../../shell/PanelHeader';
import { useEditor, type TrackItem } from '../../state';
import { usePremium } from '../../ui/premium';
import { Icon } from '../../ui/Icon';
import { ChannelStickerView, findLook, looks, platform, platforms, platsFor, swatches } from './looks';
import { hasVariant } from '../../variant';
import { MAX_STICKERS, isChannelSticker, loadChannel, platsOf, saveChannel, setGhost, slotY, span, stickerItem, timingLabel, timingOf, toSticker, type Timing } from './channel-set';
import './channel-stickers.css';

// ch-stickers (design-drafts/261030-channel-sticker, B3, promoted 30 Oct): Channel stickers rail tab, 2nd after Templates.
// Add from the panel only (hover a look, "+ Add"); the video is for selecting, moving and removing.

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** Multi-platform is on when the user switched it on, or the sticker already shows several platforms. */
const isMultiOn = (item: TrackItem) => item.style?.multi === true || (item.style?.multi !== false && platsOf(item).length > 1);

export function ChannelStickers() {
  const { state, actions } = useEditor(), premium = usePremium();
  const list = state.elements.filter(isChannelSticker), full = list.length >= MAX_STICKERS;
  const selected = list.find(x => x.id === state.selectedElementId);
  const [tab, setTab] = useState<'All'|'Animated'|'Static'>('All');
  const [keep, setKeep] = useState(() => loadChannel().keep), [note, setNote] = useState('');
  // Style editing expands under the selected card; a click outside the side panel collapses it.
  const [expanded, setExpanded] = useState<string|null>(null);
  const saved = loadChannel();

  // Open on the first sticker; remember the set for new clips.
  useEffect(() => { if (!selected && list[0]) actions.patch({ selectedElementId: list[0].id }); }, []);
  useEffect(() => { if (keep) saveChannel({ set: list.map(x => toSticker(x, state.duration)) }); }, [state.elements, keep]);
  useEffect(() => () => setGhost(null), []);
  // ch-multi-visible (round 3 keep, re-added on v3): labelled Multi row; after a second platform replaced the first, offer both.
  const multiVisible = hasVariant('ch-multi-visible');
  const [offer, setOffer] = useState<{ id: string; prev: string; next: string } | null>(null);
  useEffect(() => { setNote(''); setOffer(null); if (list.some(x => x.id === state.selectedElementId)) setExpanded(state.selectedElementId); }, [state.selectedElementId]);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('.side-panel')) setExpanded(null); };
    document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close);
  }, []);

  const name = selected?.label ?? saved.lastName, color = selected ? String(selected.style?.color || 'original') : 'original';
  const basePlats = selected ? platsOf(selected) : [saved.lastPlat];
  // All lists animated looks first (looks is ordered that way), then static.
  const shown = looks.filter(l => tab === 'All' || (tab === 'Animated') === Boolean(l.animated));

  function add(lookId: string) {
    if (full) { actions.notify(`Up to ${MAX_STICKERS} stickers per clip`); return; }
    if (findLook(lookId).animated && !premium.require('animated-social-stickers')) return;
    const at = state.playhead, visible = list.filter(x => at >= x.start && at < x.start + x.duration).length;
    const timing: Timing = list.some(x => timingOf(x, state.duration) === 'whole') ? 'end' : 'whole';
    const plats = platsFor(lookId, [saved.lastPlat], saved.lastPlat);
    const id = actions.addItem(stickerItem({ look: lookId, plats, color, name, timing }, state.duration, visible));
    const [start] = span(timing, state.duration);
    actions.patch({ selectedElementId: id, playhead: at >= start ? at : start });
    setGhost(null);
  }
  const update = (item: TrackItem, change: Partial<TrackItem>, style: Record<string, string|boolean> = {}) => actions.updateItem(item.id, { ...change, style: { ...item.style, ...style } });
  function showBoth(item: TrackItem, prev: string, next: string) {
    setOffer(null); update(item, {}, { multi: true, plats: platforms.map(p => p.id).filter(p => p === prev || p === next).join(',') });
  }
  function setPlatform(item: TrackItem, id: string) {
    const plats = platsOf(item), on = plats.includes(id);
    // Multi-platform off: one platform (click replaces). On: toggle 1 to 4 platforms.
    if (!isMultiOn(item)) {
      setOffer(multiVisible && plats.length === 1 && plats[0] !== id ? { id: item.id, prev: plats[0], next: id } : null);
      update(item, {}, { plats: id }); saveChannel({ lastPlat: id }); return;
    }
    if (on && plats.length <= 1) { setNote('Keep at least one platform.'); return; }
    if (!on && plats.length >= 4) { setNote('Up to 4 platforms on one sticker.'); return; }
    setNote(''); update(item, {}, { plats: platforms.map(p => p.id).filter(p => p === id ? !on : plats.includes(p)).join(',') });
    if (!on) saveChannel({ lastPlat: id });
  }
  function setMultiPlatform(item: TrackItem, on: boolean) {
    setNote(''); setOffer(null); update(item, {}, on ? { multi: true } : { multi: false, plats: platsOf(item)[0] || saved.lastPlat });
  }
  function setTiming(item: TrackItem, timing: Timing) {
    const now = state.playhead, from = timing === 'custom' ? Math.min(now, state.duration - 5) : 0;
    const [a, b] = span(timing, state.duration, from, from + 5);
    update(item, { start: a, duration: b - a }, { timing });
    if (now < a || now >= b) actions.patch({ playhead: a });
  }

  return <div className="channel-panel">
    <PanelHeader title="Channel stickers" subtitle="Let viewers know where to find you. Hover a look and click + Add." />

    <div className="cs-sec"><h3>On this clip</h3><span>{list.length} of {MAX_STICKERS}</span></div>
    <div className="cs-onclip">
      {list.map((x, i) => {
        const timing = timingOf(x, state.duration);
        const open = expanded === x.id && x.id === selected?.id;
        const toggle = () => { if (open) { setExpanded(null); return; } setExpanded(x.id); actions.patch({ selectedElementId: x.id, playhead: x.start }); };
        return <div key={x.id} className={'cs-group' + (open ? ' open' : '')}><div role="button" tabIndex={0} aria-expanded={open} className={'cs-item' + (x.id === selected?.id ? ' selected' : '')} onClick={toggle} onKeyDown={e => e.key === 'Enter' && toggle()}>
          <span className="cs-mini"><ChannelStickerView look={String(x.style?.look)} plats={platsOf(x)} color={String(x.style?.color || 'original')} name={x.label} size="7.5px" /></span>
          <span className="cs-item-text"><b>{x.label || 'No name yet'}</b><small>{timingLabel[timing]} · {fmt(x.start)}–{fmt(x.start + x.duration)}</small></span>
          <button className="cs-x" aria-label={`Remove sticker ${i + 1}`} title="Remove" onClick={e => { e.stopPropagation(); actions.removeItem(x.id); }}><Icon name="close" size={13} /></button>
        </div>{open && <StickerSheet key={x.id} item={x} index={i} note={note} multiVisible={multiVisible} offer={offer?.id === x.id ? offer : null} onBoth={() => offer && showBoth(x, offer.prev, offer.next)}
          onName={v => { update(x, { label: v }); saveChannel({ lastName: v }); }} onPlatform={p => setPlatform(x, p)} onMulti={on => setMultiPlatform(x, on)}
          onColor={c => update(x, {}, { color: c })} onTiming={t => setTiming(x, t)}
          onRange={(a, b) => update(x, { start: a, duration: b - a }, { timing: 'custom' })} />}</div>;
      })}
      {!list.length && <div className="cs-empty">No channel sticker yet. Hover a look below and click <b>+ Add</b>.</div>}
    </div>
    {full && <p className="cs-hint warn">Up to {MAX_STICKERS} stickers per clip.</p>}
    <label className="cs-check"><input type="checkbox" checked={keep} onChange={e => { setKeep(e.target.checked); saveChannel({ keep: e.target.checked }); }} /> Use these stickers on every new clip</label>

    <div className="cs-sec"><h3>Looks</h3><span>{looks.length} looks · all recolour</span></div>
    <div className="cs-look-bar">
      <div className="cs-pills" role="tablist">{(['All', 'Animated', 'Static'] as const).map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
    </div>
    <div className="cs-tiles" onMouseLeave={() => setGhost(null)}>
      {shown.map(l => {
        const plats = platsFor(l.id, basePlats, saved.lastPlat);
        return <div key={l.id} className={'cs-tile' + (selected?.style?.look === l.id ? ' selected' : '')} tabIndex={0} title={l.name}
          onMouseEnter={() => !full && setGhost({ look: l.id, plats, color, name })} onFocus={() => !full && setGhost({ look: l.id, plats, color, name })}>
          {l.animated && <span className="cs-pro">PRO</span>}
          <ChannelStickerView look={l.id} plats={plats} color={color} name={name} size="11px" />
          <span className="cs-hov"><button disabled={full} title={full ? `Up to ${MAX_STICKERS} stickers per clip` : 'Add to this clip'} onClick={e => { e.stopPropagation(); add(l.id); }}>+ Add</button></span>
        </div>;
      })}
    </div>

  </div>;
}

function StickerSheet({ item, index, note, multiVisible, offer, onBoth, onName, onPlatform, onMulti, onColor, onTiming, onRange }: {
  item: TrackItem; index: number; note: string; multiVisible: boolean; offer: { prev: string; next: string } | null; onBoth: () => void; onName: (v: string) => void; onPlatform: (p: string) => void; onMulti: (on: boolean) => void; onColor: (c: string) => void;
  onTiming: (t: Timing) => void; onRange: (a: number, b: number) => void;
}) {
  const { state } = useEditor();
  const look = findLook(String(item.style?.look)), plats = platsOf(item), color = String(item.style?.color || 'original');
  const timing = timingOf(item, state.duration), custom = color.startsWith('#'), multi = isMultiOn(item);
  const [from, setFrom] = useState(String(Math.round(item.start))), [to, setTo] = useState(String(Math.round(item.start + item.duration)));
  useEffect(() => { setFrom(String(Math.round(item.start))); setTo(String(Math.round(item.start + item.duration))); }, [item.start, item.duration]);
  const a = Number(from), b = Number(to), valid = from !== '' && to !== '' && a >= 0 && b <= state.duration && b - a >= 1;
  const pickRange = (f: string, t: string) => { setFrom(f); setTo(t); const x = Number(f), y = Number(t); if (f !== '' && t !== '' && x >= 0 && y <= state.duration && y - x >= 1) onRange(x, y); };
  const swatchValue = () => getComputedStyle(document.documentElement).getPropertyValue('--ch-sw-purple').trim();

  // Opens under the sticker card: one row per setting, name : option.
  return <section className="cs-sheet" aria-label={`Edit sticker ${index + 1}`}>
    <div className="cs-line"><label htmlFor="cs-name">Name</label>
      <input id="cs-name" className={'cs-field' + (item.label ? '' : ' need')} maxLength={24} value={item.label} placeholder="Your channel name" onChange={e => onName(e.target.value)} /></div>
    <div className="cs-line"><span title={multi ? 'Pick 1 to 4 platforms, same name' : 'Pick 1 platform'}>Platform</span>
      <div className="cs-plat-row"><div className="cs-plats">{platforms.map(p => <button key={p.id} title={p.label} aria-label={p.label} aria-pressed={plats.includes(p.id)} onClick={() => onPlatform(p.id)}
        style={{ background: `var(--ch-${p.id})`, color: p.light ? 'var(--ch-ink)' : 'var(--ch-white)' }}>{p.glyph}</button>)}</div>
        {!multiVisible && <label className="cs-toggle small"><input type="checkbox" checked={multi} onChange={e => onMulti(e.target.checked)} /><span className="trk" />Multi</label>}</div></div>
    {multiVisible && <div className="cs-line"><span /><label className="cs-toggle small cs-multi-visible"><input type="checkbox" checked={multi} onChange={e => onMulti(e.target.checked)} /><span className="trk" />Multi: show more than one platform</label></div>}
    {multiVisible && offer && <p className="cs-hint cs-offer">Showing {platform(offer.next).label} only. <button className="cs-btn" onClick={onBoth}>Show {platform(offer.prev).label} too</button></p>}
    {note && <p className="cs-hint warn">{note}</p>}
    <div className="cs-line"><span>Colour</span>
      <div className="cs-swatches">
        <button className="orig" aria-pressed={color === 'original'} onClick={() => onColor('original')}>Original</button>
        {swatches.map(s => <button key={s.id} title={s.id} aria-label={s.id} aria-pressed={color === s.id} style={{ background: `var(--ch-sw-${s.id.toLowerCase()})` }} onClick={() => onColor(s.id)} />)}
        <label className="custom" title="Custom colour" aria-pressed={custom}><input type="color" aria-label="Custom colour" value={custom ? color : swatchValue()} onChange={e => onColor(e.target.value)} /></label>
      </div></div>
    <div className="cs-line"><span>When</span>
      <div className="cs-seg">{(Object.keys(timingLabel) as Timing[]).map(t => <button key={t} className={timing === t ? 'on' : ''} onClick={() => onTiming(t)}>{timingLabel[t]}</button>)}</div></div>
    {timing === 'custom' && <div className="cs-custom">
      <label>From<span><input className="cs-field" aria-label="From (seconds)" inputMode="numeric" maxLength={3} value={from} onChange={e => pickRange(e.target.value.replace(/\D/g, ''), to)} /><em>s</em></span></label>
      <label>To<span><input className="cs-field" aria-label="To (seconds)" inputMode="numeric" maxLength={3} value={to} onChange={e => pickRange(from, e.target.value.replace(/\D/g, ''))} /><em>s</em></span></label>
      <button className="cs-btn" onClick={() => { const len = valid ? b - a : 5, s = Math.min(Math.floor(state.playhead), state.duration - 1); pickRange(String(s), String(Math.min(state.duration, s + len))); }}>Start at {fmt(state.playhead)}</button>
      <div className="cs-bar" title={valid ? `${fmt(a)}–${fmt(b)} (${b - a} s)` : `Pick a range inside 0–${state.duration} s, at least 1 s long`}>{valid && <span style={{ left: `${a / state.duration * 100}%`, width: `${(b - a) / state.duration * 100}%` }} />}<i style={{ left: `${state.playhead / state.duration * 100}%` }} /></div>
    </div>}
    {timing === 'custom' && !valid && <p className="cs-hint warn">Pick a range inside 0–{state.duration} s, at least 1 s long.</p>}
  </section>;
}
