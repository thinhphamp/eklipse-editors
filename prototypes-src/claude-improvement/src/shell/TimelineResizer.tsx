import { useEffect, useRef, useState } from 'react';
import './timeline-resizer.css';

const KEY = 'ek-proto-timeline-height', MIN = 140, DEFAULT = 248;
// The stage keeps at least ~330 px for the source view, preview and their controls.
const max = () => Math.max(MIN, Math.min(Math.round(window.innerHeight * .6), window.innerHeight - 450));
const clamp = (h: number) => Math.max(MIN, Math.min(max(), Math.round(h)));
const load = () => { try { return clamp(Number(localStorage.getItem(KEY)) || DEFAULT); } catch { return DEFAULT; } };
const save = (h: number) => { try { localStorage.setItem(KEY, String(h)); } catch { /* storage unavailable */ } };

/** Drag bar between the playback bar and the timeline (as in the reference editor): resizes the timeline. */
export function TimelineResizer() {
  const [height, setHeight] = useState(load);
  const [dragging, setDragging] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => { bar.current?.closest<HTMLElement>('.editor-main')?.style.setProperty('--timeline-h', height + 'px'); }, [height]);
  const set = (h: number) => { const next = clamp(h); setHeight(next); save(next); };
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const startY = event.clientY, startH = height, el = event.currentTarget;
    el.setPointerCapture(event.pointerId);
    setDragging(true);
    const move = (e: PointerEvent) => set(startH + (startY - e.clientY));
    const up = () => { setDragging(false); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  return <div ref={bar} className={'timeline-resizer' + (dragging ? ' dragging' : '')} role="separator" aria-orientation="horizontal" aria-label="Resize timeline"
    aria-valuemin={MIN} aria-valuemax={max()} aria-valuenow={height} tabIndex={0} title="Drag to resize the timeline"
    onPointerDown={onPointerDown}
    onKeyDown={e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); set(height + (e.key === 'ArrowUp' ? 20 : -20)); } }}/>;
}
