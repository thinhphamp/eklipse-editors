import { useEffect, useMemo, useRef } from 'react';
import type { LayoutName } from '../data';
import { useEditor } from '../state';
import { drawFrame, fitCanvas } from '../engine/compositor';
import { layoutAt, resolveRecipe, segmentRecipe, type Recipe } from '../engine/layout-recipes';
import { getEngine } from '../engine/playback-engine';
import { shaderFilterAt, shaderTransformAt } from '../engine/shaders';
import { zoomAt } from '../engine/timeline-map';
import { liveSource, usePoster } from '../engine/use-frame-source';
import { cssVar } from '../theme/css-var';

/**
 * Draws `draw` into a canvas that fills its parent: once per change and, when
 * `live`, on every engine tick (each animation frame while playing).
 */
function useCanvasPainter(draw: (ctx: CanvasRenderingContext2D) => void, live: boolean, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let frame = 0;
    const paint = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { fitCanvas(canvas); const ctx = canvas.getContext('2d'); if (ctx) drawRef.current(ctx); }); };
    paint();
    const resize = new ResizeObserver(paint);
    resize.observe(canvas);
    const unsubscribe = live ? getEngine().subscribe(paint) : () => {};
    return () => { cancelAnimationFrame(frame); resize.disconnect(); unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, ...deps]);
  return ref;
}

const roleTone = (role: string) => role === 'Gameplay' ? 'blue' : 'pink';

export { SourceCropEditor as SourceCanvas } from './SourceCropEditor';

// C10: a 16:9 output keeps the whole horizontal source; in the 9:16 phone frame it shows letterboxed.
const LANDSCAPE: Recipe = { blurBackground: false, crops: [{ id: 'landscape', role: 'Gameplay', source: { x: 0, y: 0, w: 1, h: 1 }, target: { x: 0, y: (1 - 81 / 256) / 2, w: 1, h: 81 / 256 }, shape: 'rect', z: 0 }] };

/** 9:16 output frame for a layout: live (main preview) or a still thumbnail. `landscape` draws the 16:9 output instead. */
export function LayoutCanvas({ layout, thumbnail = false, live = false, landscape = false }: { layout: LayoutName; second?: number; thumbnail?: boolean; live?: boolean; landscape?: boolean }) {
  const { state } = useEditor();
  const poster = usePoster();
  const background = useMemo(() => cssVar('--frame', 'black'), []);
  const overrides = thumbnail ? undefined : state.cropOverrides;
  const recipe = useMemo(() => resolveRecipe(layout, overrides), [layout, overrides]);
  const ref = useCanvasPainter(ctx => {
    const source = live ? liveSource(poster) : poster;
    if (!source) return;
    const t = getEngine().time;
    // The live preview follows per-segment layouts as the clock moves.
    const segmentLayout = live ? layoutAt(t, layout, state.splitPoints, state.segmentLayouts) : layout;
    const active = landscape ? LANDSCAPE : live ? segmentRecipe(segmentLayout, t, state.splitPoints, state.cropOverrides) : recipe;
    drawFrame(ctx, source, { ...active, crops: active.crops.filter(c => c.source.w > 0 && c.source.h > 0) }, live ? { zoom: zoomAt(t, state.effects), filter: shaderFilterAt(t, state.effects), transform: shaderTransformAt(t, state.effects), background: background } : { background: background });
  }, live, [poster, recipe, landscape, state.effects, state.splitPoints, state.segmentLayouts]);
  const cls = layout.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return <div className={'layout-canvas layout-' + cls + (thumbnail ? ' thumbnail' : '')}><canvas ref={ref} aria-label={layout + ' preview'}/></div>;
}
