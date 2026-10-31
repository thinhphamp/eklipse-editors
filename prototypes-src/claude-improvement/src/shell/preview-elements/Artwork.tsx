import { useEffect, useRef } from 'react';
import type { TrackItem } from '../../state';
import { Lottie } from './Lottie';
import { AnimatedImage } from './AnimatedImage';
import { letterFrame } from './letter-animation';
import { PlatformIcon } from '../../tabs/elements/PlatformIcon';
import { StickerView } from '../../tabs/elements/social-stickers/StickerView';
import { ChannelStickerView } from '../../tabs/channel/looks';

export function Artwork({item,time,playing}:{item:TrackItem;time:number;playing:boolean}) {
  const video=useRef<HTMLVideoElement>(null);
  useEffect(()=>{if(!video.current)return;const local=Math.max(0,time-item.start);if(Math.abs(video.current.currentTime-local)>.12)video.current.currentTime=local;if(playing)void video.current.play().catch(()=>{});else video.current.pause()},[time,playing,item.start]);
  if(item.media?.endsWith('.webm'))return <video ref={video} src={item.media} muted playsInline className="element-image"/>;
  if(item.media?.endsWith('.json'))return <Lottie path={item.media} time={Math.max(0,time-item.start)}/>;
  if(item.media?.endsWith('.webp'))return <AnimatedImage path={item.media} time={Math.max(0,time-item.start)} alt={item.label} playing={playing}/>;
  if(item.media)return <img className="element-image" src={item.media} alt={item.label}/>;
  if(item.category==='Social Stickers'&&item.style?.look)return <ChannelStickerView look={String(item.style.look)} plats={String(item.style.plats||'twitch').split(',')} color={String(item.style.color||'original')} name={item.label} size="3cqw"/>;
  if(item.category==='Social Stickers'&&item.style?.design)return <StickerView id={String(item.style.design)} name={item.label} size="3cqw"/>;
  if(item.category==='Social Stickers')return <span className="element-social" data-platform={String(item.style?.platform||'Twitch')}><PlatformIcon platform={String(item.style?.platform||'Twitch')}/><strong>{item.label}</strong><small>Follow</small></span>;
  if(item.category==='Text Elements')return <span className="element-text" data-visual={String(item.style?.visualEffect||'None')} style={{color:String(item.style?.fill||'var(--art-81fc41)'),fontFamily:String(item.style?.font||'inherit'),fontWeight:String(item.style?.weight||'bold'),fontStyle:item.style?.italic?'italic':'normal',letterSpacing:`${Number(item.style?.spacing||0)}px`,WebkitTextStroke:item.style?.stroke&&item.style.stroke!=='Default'?`1px ${item.style.stroke}`:undefined,background:item.style?.background&&item.style.background!=='Default'?String(item.style.background):undefined}}>{String(item.style?.letterAnimation||'None')==='None'&&!['Floating words','Wave','Snap Wave','Wobble'].includes(String(item.style?.visualEffect||'None'))?item.label:item.label.split('').map((character,index)=><span key={index} className="preview-letter" style={letterFrame(String(item.style?.letterAnimation),time-item.start,index,String(item.style?.visualEffect||'None'))}>{character===' '? '\u00a0':character}</span>)}</span>;
  if(item.category==='Reactions')return <span className="element-reaction"><b>{String(item.style?.avatar||'S')} {String(item.style?.name||'streamer')}:</b> {item.label}</span>;
  if(item.category==='Animated Stickers')return <Lottie path="media/stickers/spinning-star.json" time={Math.max(0,time-item.start)}/>;
  if(item.category==='Gifs')return <AnimatedImage path="media/gifs/gg.webp" time={Math.max(0,time-item.start)} alt={item.label} playing={playing}/>;
  if(item.category==='Twitch Emotes')return <img className="element-image" src="media/emotes/ek-smile.png" alt={item.label}/>;
  return <img className="element-image" src="media/demo-poster.jpg" alt={item.label}/>;
}
