import { useLayoutEffect, useRef } from 'react';

// Space taken around the canvases inside the stage (px): stage padding, the
// "Split"/"Preview" labels, the controls row under the canvases and bezels.
const PAD_TOP = 96, PAD_BOTTOM = 12, PAD_X = 24, LABEL = 29, CONTROLS = 54, GAP = 16, BEZEL = 14;
// pv-strip: the preview icon strip sits right of the player (34 px + 10 px gap); the top-right selects are gone, so
// the stage only keeps room for the safe-zone tag above the player and no controls row under it (Export side).
const STRIP = 44, STRIP_PAD_TOP = 40;

/**
 * Like the reference editor, the 16:9 source view and the 9:16 preview share one
 * height and are centred in the stage; that height follows the window size and
 * the timeline resize bar. Writes it to `--fit-h` on the stage element.
 */
export function useStageFit(layouts: boolean, strip = false) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    const fit = () => {
      const { width, height } = stage.getBoundingClientRect();
      const byHeight = height - (strip ? STRIP_PAD_TOP : PAD_TOP) - PAD_BOTTOM - (layouts ? LABEL : 0) - (strip && !layouts ? 0 : CONTROLS) - BEZEL;
      const aspectSum = layouts ? 16 / 9 + 9 / 16 : 9 / 16;
      const byWidth = (width - 2 * PAD_X - (layouts ? GAP + 2 * BEZEL : BEZEL) - (strip ? STRIP : 0)) / aspectSum;
      stage.style.setProperty('--fit-h', Math.max(80, Math.floor(Math.min(byHeight, byWidth))) + 'px');
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [layouts, strip]);
  return ref;
}
