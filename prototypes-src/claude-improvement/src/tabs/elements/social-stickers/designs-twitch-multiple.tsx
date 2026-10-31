import type { StickerRender } from './types';
import { PlatformIcon } from '../PlatformIcon';
import './stickers-twitch-multiple.css';

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-label="Instagram"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.4"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2.4"/><circle cx="17.4" cy="6.7" r="1.35" fill="currentColor"/></svg>;
}

function TikTokIcon() {
  return <svg viewBox="0 0 24 24" aria-label="TikTok"><path d="M14.2 3c.4 2.3 1.7 3.7 4.1 4v3.2a8.8 8.8 0 0 1-4.1-1.3v6.4a5.3 5.3 0 1 1-4.6-5.2v3.3a2.1 2.1 0 1 0 1.4 2V3Z" fill="currentColor"/></svg>;
}

function TwitchIcon() { return <PlatformIcon platform="Twitch"/>; }
function YoutubeIcon() { return <PlatformIcon platform="Youtube"/>; }

const multiIcons = <span className="stk-twitch-multiple-socials"><InstagramIcon/><TikTokIcon/><YoutubeIcon/></span>;

export const renders: Record<string, StickerRender> = {
  'sl-smu01': name => <span className="stk-twitch-multiple-multi stk-twitch-multiple-smu01">{multiIcons}<b>{name}</b></span>,
  'sl-smu02': name => <span className="stk-twitch-multiple-multi stk-twitch-multiple-smu02">{multiIcons}<b>{name}</b></span>,
  'sl-smu03': name => <span className="stk-twitch-multiple-multi stk-twitch-multiple-smu03">{multiIcons}<b>{name}</b></span>,

  'sl-stw01': name => <span className="stk-twitch-multiple-stw01"><span className="stk-twitch-multiple-follow">FOLLOW ME</span><TwitchIcon/><b>{name}</b></span>,
  'sl-stw02': name => <span className="stk-twitch-multiple-stw02"><TwitchIcon/><b>{name}</b></span>,
  'sl-stw03': name => <span className="stk-twitch-multiple-stw03"><span className="stk-twitch-multiple-logo"><TwitchIcon/></span><b>{name}</b></span>,
  'sl-stw04': name => <span className="stk-twitch-multiple-stw04"><span className="stk-twitch-multiple-cap"><TwitchIcon/></span><b>{name}</b></span>,
  'sl-stw05': name => <span className="stk-twitch-multiple-stw05"><TwitchIcon/><b>{name}</b></span>,
  'sl-stw06': name => <span className="stk-twitch-multiple-stw06"><span className="stk-twitch-multiple-logo"><TwitchIcon/><i>LIVE</i></span><b>{name}</b></span>,
  'sl-stw07': name => <span className="stk-twitch-multiple-stw07"><span className="stk-twitch-multiple-inset"><TwitchIcon/><b>{name}</b></span></span>,
  'sl-stw08': name => <span className="stk-twitch-multiple-stw08"><TwitchIcon/><b>{name}</b></span>,
  'sl-stw09': name => <span className="stk-twitch-multiple-stw09"><TwitchIcon/><b>{name}</b></span>,
  'sl-stw10': name => <span className="stk-twitch-multiple-stw10"><TwitchIcon/><b>{name}</b></span>,
  'sl-stw11': name => <span className="stk-twitch-multiple-stw11"><TwitchIcon/><b>{name}</b></span>,
  'sl-stw12': name => <span className="stk-twitch-multiple-stw12"><TwitchIcon/><b>{name}</b></span>,
  'sl-stw13': name => <span className="stk-twitch-multiple-stw13"><span className="stk-twitch-multiple-spark stk-twitch-multiple-spark-left">✦</span><TwitchIcon/><b>{name}</b><span className="stk-twitch-multiple-spark stk-twitch-multiple-spark-right">✦</span></span>,
  'sl-stw14': name => <span className="stk-twitch-multiple-pet stk-twitch-multiple-stw14"><span className="stk-twitch-multiple-animal">🐕</span><TwitchIcon/><b>{name}</b><span className="stk-twitch-multiple-animal">🐈</span></span>,
  'sl-stw15': name => <span className="stk-twitch-multiple-pet stk-twitch-multiple-stw15"><span className="stk-twitch-multiple-animal">🐈</span><TwitchIcon/><b>{name}</b><span className="stk-twitch-multiple-pillows">◆</span></span>,
};
