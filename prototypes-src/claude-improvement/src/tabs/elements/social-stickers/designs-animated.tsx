import type { StickerRender } from './types';
import { PlatformIcon } from '../PlatformIcon';
import './stickers-animated.css';

const TikTok = () => <svg className="stk-animated-tiktok" viewBox="0 0 24 24" aria-label="TikTok"><path d="M14 3v11.2a4.7 4.7 0 1 1-4-4.6v3.1a1.8 1.8 0 1 0 1 1.6V3Z" fill="currentColor"/><path d="M14 3c.5 2.7 2.1 4.1 5 4.4v3.1c-2.1-.1-3.8-.8-5-2Z" fill="currentColor"/></svg>;
const Instagram = () => <svg className="stk-animated-instagram" viewBox="0 0 24 24" aria-label="Instagram"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor"/><circle cx="12" cy="12" r="4" fill="none" stroke="var(--stk-an-white)" strokeWidth="2"/><circle cx="17.4" cy="6.7" r="1.2" fill="var(--stk-an-white)"/></svg>;
const XIcon = () => <svg viewBox="0 0 24 24" aria-label="X"><path d="M4 3h4.7l3.8 5.2L17 3h3l-6.1 7.5L21 21h-4.7l-4.5-6.2L6.7 21h-3.1l6.8-8.5Z" fill="currentColor"/></svg>;
const Bell = () => <svg className="stk-animated-bell" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16h12l-1.6-2.2V10a4.4 4.4 0 0 0-8.8 0v3.8Zm4 2a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Heart = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20S4 15.5 4 9.4C4 5 9.5 3.6 12 7c2.5-3.4 8-2 8 2.4C20 15.5 12 20 12 20Z" fill="currentColor"/></svg>;
const Star = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" fill="currentColor"/></svg>;

const platform = (kind: string, className = '') => <span className={`stk-animated-platform ${className}`}><PlatformIcon platform={kind}/></span>;

export const renders: Record<string, StickerRender> = {
  'sl-san01': name => <span className="stk-animated-01"><span className="stk-animated-01-icon">{platform('Twitch')}</span><span className="stk-animated-01-bar"><b>{name}</b><i>Follow</i></span></span>,
  'sl-san02': name => <span className="stk-animated-account stk-animated-02">{platform('Twitch','stk-animated-account-icon')}<span className="stk-animated-account-copy"><b>{name}</b><small>follower</small></span></span>,
  'sl-san03': name => <span className="stk-animated-03"><TikTok/><span><b>{name}</b><i>Follow</i></span></span>,
  'sl-san04': name => <span className="stk-animated-account stk-animated-04">{platform('Kick','stk-animated-account-icon')}<span className="stk-animated-account-copy"><b>{name}</b><small>follower</small></span></span>,
  'sl-san05': name => <span className="stk-animated-account stk-animated-05">{platform('Youtube','stk-animated-account-icon')}<span className="stk-animated-account-copy"><b>{name}</b><small>follower</small></span></span>,
  'sl-san06': name => <span className="stk-animated-06"><span className="stk-animated-06-bell"><Bell/></span><span className="stk-animated-06-name">{name}</span><span className="stk-animated-confetti"><i>✦</i><i>◆</i><i>✦</i></span></span>,
  'sl-san07': name => <span className="stk-animated-07">{platform('Youtube')}<span className="stk-animated-07-name">{name}</span><i>follow</i></span>,
  'sl-san08': name => <span className="stk-animated-08"><span className="stk-animated-08-sub">subscribe</span><span className="stk-animated-08-icon">{platform('Youtube')}</span><b>{name}</b><span className="stk-animated-08-bell"><Bell/></span></span>,
  'sl-san09': name => <span className="stk-animated-09"><span className="stk-animated-09-icons"><span className="stk-animated-i9 stk-animated-i9-a"><Instagram/></span><span className="stk-animated-i9 stk-animated-i9-b">{platform('Twitch')}</span></span><b>{name}</b></span>,
  'sl-san10': name => <span className="stk-animated-10"><span className="stk-animated-10-icons">{platform('Twitch','stk-animated-bounce-a')}<span className="stk-animated-bounce-b"><Instagram/></span>{platform('Youtube','stk-animated-bounce-c')}</span><b>{name}</b></span>,
  'sl-san11': name => <span className="stk-animated-11"><span className="stk-animated-11-name">{platform('Youtube')}<b>{name}</b></span><span className="stk-animated-11-actions"><Bell/><i>subscribe</i><span className="stk-animated-like">{<Heart/>}</span></span></span>,
  'sl-san12': name => <span className="stk-animated-12"><span className="stk-animated-12-icons">{platform('Twitch')}{platform('Youtube')}<Instagram/></span><span className="stk-animated-12-layer stk-animated-12-back"/><span className="stk-animated-12-layer stk-animated-12-mid"/><b>{name}</b></span>,
  'sl-san13': name => <span className="stk-animated-13"><span className="stk-animated-13-name">{name}</span><span className="stk-animated-13-follow"><Heart/><b>follow</b></span><span className="stk-animated-13-star"><Star/></span><span className="stk-animated-13-sparks"><i>✦</i><i>◆</i><i>✦</i></span></span>,
  'sl-san14': name => <span className="stk-animated-14"><span className="stk-animated-14-icons">{platform('Twitch')}{platform('Youtube')}{platform('Kick')}</span><span className="stk-animated-14-shadow"/><b>{name}</b></span>,
  'sl-san15': name => <span className="stk-animated-15"><span className="stk-animated-15-icon"><XIcon/></span><span className="stk-animated-15-copy"><b>{name}</b><small>follower</small></span></span>,
};
