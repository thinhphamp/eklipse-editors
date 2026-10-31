import type { CSSProperties, ReactNode } from 'react';
import './channel-looks.css';

// ch-stickers (design-drafts/261030-channel-sticker, variant B3): one library of Eklipse + StreamLadder looks.
// Every look takes a tint (--c) and the text colour on that tint (--on); "original" keeps the look's own colour.

export type PlatformId = 'twitch'|'youtube'|'kick'|'facebook'|'tiktok'|'instagram'|'x';
export const platforms: { id: PlatformId; label: string; glyph: string; light?: boolean }[] = [
  { id: 'twitch', label: 'Twitch', glyph: 'T' }, { id: 'youtube', label: 'YouTube', glyph: '▶' },
  { id: 'kick', label: 'Kick', glyph: 'K', light: true }, { id: 'facebook', label: 'Facebook', glyph: 'f' },
  { id: 'tiktok', label: 'TikTok', glyph: '♪' }, { id: 'instagram', label: 'Instagram', glyph: '◎' }, { id: 'x', label: 'X', glyph: 'X' },
];
export const platform = (id: string) => platforms.find(p => p.id === id) ?? platforms[0];

/** The 7 Eklipse swatches; light ones get dark text. */
export const swatches: { id: string; light?: boolean }[] = [
  { id: 'Purple' }, { id: 'Yellow', light: true }, { id: 'Mint', light: true }, { id: 'Red' }, { id: 'Blue' }, { id: 'Green', light: true }, { id: 'Black' },
];

export type LookKind = 'single'|'multi'|'name';
export type Look = { id: string; name: string; kind: LookKind; animated?: boolean; orig?: string };
export const looks: Look[] = [
  { id: 'slide', name: 'Slide in', kind: 'single', animated: true }, { id: 'pulse', name: 'Edge pulse', kind: 'single', animated: true },
  { id: 'bell', name: 'Subscribe bell', kind: 'name', animated: true, orig: 'bell' },
  { id: 'bounce', name: 'Bouncing icons', kind: 'multi', animated: true }, { id: 'drop', name: 'Icons drop in', kind: 'multi', animated: true },
  { id: 'block', name: 'Block', kind: 'single' }, { id: 'round', name: 'Round', kind: 'single' }, { id: 'fade', name: 'Fade', kind: 'single' },
  { id: 'cap', name: 'Circle cap', kind: 'single' }, { id: 'live', name: 'Live badge', kind: 'single' }, { id: 'follow', name: 'Follow me', kind: 'single' },
  { id: 'soft', name: 'Soft plate', kind: 'single', orig: 'soft' }, { id: 'solid', name: 'Solid', kind: 'single' }, { id: 'under', name: 'Underline', kind: 'single' },
  { id: 'neon', name: 'Neon', kind: 'name', orig: 'neon' }, { id: 'sparkle', name: 'Sparkle', kind: 'name', orig: 'sparkle' },
  { id: 'row', name: 'Icons row', kind: 'multi' }, { id: 'stack', name: 'Icons on top', kind: 'multi' }, { id: 'glow', name: 'Glow', kind: 'multi', orig: 'glow' },
];
export const findLook = (id?: string) => looks.find(l => l.id === id) ?? looks[5];
export const isMulti = (id: string) => findLook(id).kind === 'multi';

/** Platforms a look draws: multi looks need 2+, single looks show 1. */
// Multi-platform is a sticker option, not a property of the look: every look draws the 1-4 platforms it is given.
export function platsFor(_lookId: string, wanted: string[], fallback = 'twitch'): string[] {
  return wanted.length ? wanted.slice(0, 4) : [fallback];
}

const luminance = (hex: string) => { const n = parseInt(hex.slice(1, 7), 16); return ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; };
/** Tint and text colour for a sticker. `color` = 'original' | swatch id | custom hex picked by the user. */
export function tint(lookId: string, plats: string[], color: string) {
  const look = findLook(lookId), p0 = platform(plats[0] || 'twitch');
  if (color === 'original') return { c: look.orig ? `var(--ch-orig-${look.orig})` : `var(--ch-${p0.id})`, on: !look.orig && p0.light ? 'var(--ch-ink)' : 'var(--ch-white)' };
  const sw = swatches.find(s => s.id === color);
  if (sw) return { c: `var(--ch-sw-${sw.id.toLowerCase()})`, on: sw.light ? 'var(--ch-ink)' : 'var(--ch-white)' };
  return { c: color, on: color.startsWith('#') && luminance(color) > .62 ? 'var(--ch-ink)' : 'var(--ch-white)' };
}

/** One channel sticker. `size` = px (or cqw) per em: tiles pass ~8px, the preview passes a cqw size. */
export function ChannelStickerView({ look, plats, color = 'original', name, size }: { look: string; plats: string[]; color?: string; name: string; size?: string }) {
  const { c, on } = tint(look, plats, color), text = name || 'your name', ps = plats.map(platform);
  // Single-icon looks fit all chosen platforms in their icon slot.
  const icon = () => !ps.length ? null : ps.length === 1 ? <i className="ic">{ps[0].glyph}</i> : <i className="ic many">{ps.slice(0, 4).map(p => <span key={p.id}>{p.glyph}</span>)}</i>;
  // Icons in multi looks keep their platform colour unless the user tinted the sticker.
  const iconStyle = (p: typeof ps[number]) => (color === 'original' ? { '--pc': `var(--ch-${p.id})`, '--po': p.light ? 'var(--ch-ink)' : 'var(--ch-white)' } : { '--pc': c, '--po': on }) as CSSProperties;
  const icons = <span className="icons">{ps.slice(0, 4).map(p => <i key={p.id} className="ic" style={iconStyle(p)}>{p.glyph}</i>)}</span>;
  const nm = <b className="nm">{text}</b>;
  const body: Record<string, ReactNode> = {
    block: <>{icon()}{nm}</>, round: <>{icon()}{nm}</>, fade: <>{icon()}{nm}</>, cap: <>{icon()}{nm}</>, slide: <>{icon()}{nm}</>, pulse: <>{icon()}{nm}</>,
    solid: <>{icon()}{nm}</>, soft: <>{icon()}{nm}</>, live: <>{icon()}{nm}<span className="lv">LIVE</span></>,
    under: <><span className="row">{icon()}{nm}</span><span className="ul" /></>,
    follow: <><span className="row">{ps.length > 0 && <i className="ic-plain">{ps.slice(0, 4).map(p => p.glyph).join(' ')}</i>}{nm}</span><small>FOLLOW ME</small><span className="ul" /></>,
    neon: nm, sparkle: nm, bell: <><i className="ic">◔</i>{nm}</>,
    row: <>{icons}{nm}</>, stack: <>{icons}{nm}</>, glow: <>{icons}{nm}</>, bounce: <>{icons}{nm}</>, drop: <>{icons}{nm}</>,
  };
  return <span className={`cs-stk cs-${look}${text.length > 14 ? ' long' : ''}`} data-look={look} style={{ '--c': c, '--on': on, fontSize: size || '8px' } as CSSProperties}>{body[look] ?? body.block}</span>;
}
