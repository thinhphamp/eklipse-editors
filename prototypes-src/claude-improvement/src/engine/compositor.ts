import type { Crop, Recipe, Rect } from './layout-recipes';
import { SOURCE } from './layout-recipes';

export type DrawOptions = {
  /** Zoom applied to Gameplay crops (1 = none) around a focus point inside the crop. */
  zoom?: { factor: number; focus: { x: number; y: number } };
  /** CSS filter string for the whole frame (shader approximations). */
  filter?: string;
  /** Background behind non-blurred layouts, read from the --bg-canvas token by the caller. */
  background?: string;
  /** Whole-frame motion from shader effects (fractions of the frame, radians). */
  transform?: { dx: number; dy: number; scale: number; rotate: number }|null;
};

function zoomed(src: Rect, zoom: DrawOptions['zoom']): Rect {
  if (!zoom || zoom.factor === 1) return src;
  const w = src.w / zoom.factor, h = src.h / zoom.factor;
  return { x: src.x + (src.w - w) * zoom.focus.x, y: src.y + (src.h - h) * zoom.focus.y, w, h };
}

function clip(ctx: CanvasRenderingContext2D, crop: Crop, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  if (crop.shape === 'circle') ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (crop.shape === 'rounded') ctx.roundRect(x, y, w, h, Math.min(w, h) * (crop.radius ?? .06));
  else ctx.rect(x, y, w, h);
  ctx.clip();
}

/** Draws one output frame (9:16) from a 16:9 source (video, image or canvas). */
export function drawFrame(ctx: CanvasRenderingContext2D, source: CanvasImageSource, recipe: Recipe, opts: DrawOptions = {}) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const sw = (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || SOURCE.width;
  const sh = (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || SOURCE.height;
  ctx.save();
  ctx.filter = opts.filter || 'none';
  ctx.fillStyle = opts.background || 'black';
  ctx.fillRect(0, 0, W, H);
  if (recipe.blurBackground) {
    // Cover the frame with a blurred, slightly enlarged copy of the source.
    const scale = Math.max(W / sw, H / sh) * 1.15, bw = sw * scale, bh = sh * scale;
    ctx.filter = (opts.filter ? opts.filter + ' ' : '') + `blur(${Math.round(W / 40)}px) brightness(.8)`;
    ctx.drawImage(source, (W - bw) / 2, (H - bh) / 2, bw, bh);
    ctx.filter = opts.filter || 'none';
  }
  const tf = opts.transform;
  if (tf) {
    ctx.translate(W / 2 + tf.dx * W, H / 2 + tf.dy * H);
    ctx.rotate(tf.rotate);
    ctx.scale(tf.scale, tf.scale);
    ctx.translate(-W / 2, -H / 2);
  }
  for (const crop of recipe.crops) {
    const src = crop.role === 'Gameplay' ? zoomed(crop.source, opts.zoom) : crop.source;
    const x = crop.target.x * W, y = crop.target.y * H, w = crop.target.w * W, h = crop.target.h * H;
    ctx.save();
    clip(ctx, crop, x, y, w, h);
    ctx.drawImage(source, src.x * sw, src.y * sh, src.w * sw, src.h * sh, x, y, w, h);
    ctx.restore();
  }
  ctx.restore();
}

/** Resizes a canvas backing store to its CSS box × devicePixelRatio; returns true if it changed. */
export function fitCanvas(canvas: HTMLCanvasElement, maxScale = 2): boolean {
  const scale = Math.min(window.devicePixelRatio || 1, maxScale);
  const w = Math.max(1, Math.round(canvas.clientWidth * scale)), h = Math.max(1, Math.round(canvas.clientHeight * scale));
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w; canvas.height = h;
  return true;
}
