import type { CSSProperties } from 'react';
import type { CaptionStyle } from './model';
export function captionStyle(style: CaptionStyle, responsive = false): CSSProperties {
  const shadows: string[] = [];
  if (style.shadow) shadows.push(`${Number(style.shadowX ?? 2)}px ${Number(style.shadowY ?? 3)}px ${Number(style.shadowBlur ?? 3)}px ${style.shadow}`);
  if (style.glow) shadows.push(`0 0 ${Number(style.glowRadius ?? 12)}px ${style.glow}`);
  if (style.extraStroke) {
    const d = Number(style.extraStrokeWidth ?? 3);
    shadows.push(...[[-d, 0], [d, 0], [0, -d], [0, d]].map(([x, y]) => `${x}px ${y}px 0 ${style.extraStroke}`));
  }
  return { fontFamily: String(style.font || 'CaptionBangers'), fontSize: responsive ? `${Number(style.size ?? 48) / 8}cqw` : `${Number(style.size ?? 48)}px`,
    fontWeight: Number(style.weight ?? 800), fontStyle: style.italic ? 'italic' : 'normal', textTransform: style.uppercase ? 'uppercase' : 'none',
    letterSpacing: `${Number(style.spacing ?? 0)}px`, lineHeight: Number(style.leading ?? 1.1), color: String(style.fill || 'var(--text-1)'),
    WebkitTextStroke: `${Number(style.strokeWidth ?? 2)}px ${String(style.stroke || 'var(--bg-app)')}`, paintOrder: 'stroke fill',
    background: String(style.background || 'transparent'), borderRadius: `${Number(style.backgroundRadius ?? 4)}px`,
    opacity: Number(style.opacity ?? 100) / 100, textShadow: shadows.length ? shadows.join(',') : 'none',
    whiteSpace: style.breakLines === false ? 'nowrap' : 'normal' };
}
export const motionNames = ['none', 'reveal', 'fade-in', 'slide-right', 'slide-left', 'slide-top', 'slide-bottom', 'shrink', 'bounce', 'scale-underline', 'opacity'];
/** Frame-clock driven motion stays frozen while paused and reproduces correctly after seeks. */
export function captionMotion(name: string, elapsedMs: number, durationMs = 300): CSSProperties {
  const p = Math.max(0, Math.min(1, elapsedMs / durationMs)); const remaining = 1 - p;
  name = name.toLowerCase().replaceAll(' ', '-');
  if (name === 'reveal' || name === 'marker-reveal') return { clipPath: `inset(0 ${remaining * 100}% 0 0)` };
  if (name === 'fade-in' || name === 'opacity') return { opacity: p };
  if (name.startsWith('slide-') || name === 'cascade-slide') {
    const x = name === 'slide-right' ? -remaining * 28 : name === 'slide-left' ? remaining * 28 : 0;
    const y = name === 'slide-bottom' ? -remaining * 28 : name === 'slide-top' || name === 'cascade-slide' ? remaining * 28 : 0;
    return { transform: `translate(${x}px,${y}px)`, opacity: p };
  }
  if (name === 'shrink') return { transform: `scale(${1 + remaining * .6})`, opacity: p };
  if (['bounce', 'karaoke-bounce', 'random-bounce'].includes(name)) return { transform: `translateY(${-Math.sin(p * Math.PI) * 8}px) scale(${.7 + .3 * p})` };
  if (name === 'morph-bloom' || name === 'scale-to-fit' || name === 'scale-underline') return { transform: `scale(${.6 + p * .4})` };
  return {};
}
