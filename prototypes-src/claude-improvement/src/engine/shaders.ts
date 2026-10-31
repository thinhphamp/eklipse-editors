import type { TrackItem } from '../state/types';

/**
 * Canvas filter approximations of the shader effects active at `t`
 * (phase 05 R4 fills this in). Return '' for no effect.
 */
export function shaderFilterAt(t: number, effects: TrackItem[]): string {
  const item = effects.find(e => e.kind === 'effect' && (e.category === 'Effects' || e.shader) && t >= e.start && t < e.start + e.duration);
  if (!item) return '';
  const phase = Math.max(0, Math.min(1, (t - item.start) / Math.max(.01, item.duration)));
  const pulse = Math.sin(phase * Math.PI);
  const name = item.shader || item.label;
  switch (name) {
    case 'Zoom Blur': return `blur(${(pulse * 2.4).toFixed(1)}px) contrast(${(1 + pulse * .25).toFixed(2)})`;
    case 'Shake': case 'Screen Shake': return `blur(${(pulse * .6).toFixed(1)}px)`;
    case 'Slide Shake': case 'Slide': return `blur(${(pulse * 1.4).toFixed(1)}px) brightness(${(1 + pulse * .12).toFixed(2)})`;
    case 'Morph': return `contrast(${(1 + pulse * .3).toFixed(2)}) saturate(${(1 + pulse * .5).toFixed(2)})`;
    case 'Glitch': return `hue-rotate(${(Math.sin(t * 50) * pulse * 18).toFixed(1)}deg) contrast(1.15)`;
    case 'Pixelate': return `contrast(${(1 + pulse * .55).toFixed(2)}) saturate(.8)`;
    case 'Film Grain Shake': return `contrast(${(1 + pulse * .12).toFixed(2)}) brightness(${(1 - pulse * .05).toFixed(2)})`;
    default: return '';
  }
}

export type FrameTransform = { dx: number; dy: number; scale: number; rotate: number };

/** Geometric part of the shader effects (fractions of the frame, radians), applied by the compositor. */
export function shaderTransformAt(t: number, effects: TrackItem[]): FrameTransform|null {
  const item = effects.find(e => e.kind === 'effect' && (e.category === 'Effects' || e.shader) && t >= e.start && t < e.start + e.duration);
  if (!item) return null;
  const phase = Math.max(0, Math.min(1, (t - item.start) / Math.max(.01, item.duration)));
  const pulse = Math.sin(phase * Math.PI);
  const jitter = (f: number) => Math.sin(t * f) * pulse;
  switch (item.shader || item.label) {
    case 'Shake': return { dx: jitter(70) * .025, dy: 0, scale: 1.05, rotate: 0 };
    case 'Screen Shake': return { dx: jitter(61) * .03, dy: jitter(47) * .03, scale: 1.07, rotate: jitter(39) * .01 };
    case 'Slide Shake': return { dx: (1 - phase) * .12 + jitter(55) * .015, dy: 0, scale: 1.04, rotate: 0 };
    case 'Slide': return { dx: (1 - phase) * (1 - phase) * .25, dy: 0, scale: 1, rotate: 0 };
    case 'Zoom Blur': return { dx: 0, dy: 0, scale: 1 + pulse * .12, rotate: 0 };
    case 'Morph': return { dx: 0, dy: 0, scale: 1 + pulse * .06, rotate: jitter(9) * .03 };
    case 'Film Grain Shake': return { dx: jitter(83) * .006, dy: jitter(71) * .006, scale: 1.02, rotate: 0 };
    default: return null;
  }
}
