import type { TrackItem } from '../../state';
import { defaultAnimation } from '../../tabs/elements/animation-model';
const smooth=(v:number)=>v*v*(3-2*v);
export function motion(item:TrackItem,time:number){
 const style=item.style||{},entry=String(item.animationIn||defaultAnimation(item.category)),exit=String(item.animationOut||defaultAnimation(item.category));
 const duration=(speed:number)=>2.5-2*speed/100;
 const inDuration=duration(Number(style.inSpeed??75)),outDuration=duration(Number(style.outSpeed??75));
 const remaining=item.start+item.duration-time,elapsed=time-item.start,isOut=remaining<outDuration,phase=isOut?'out':'in';
 const name=isOut?exit:entry,active=isOut?remaining<outDuration:elapsed<inDuration;
 const progress=active?Math.max(0,Math.min(1,isOut?remaining/outDuration:elapsed/inDuration)):1;
 const t=smooth(progress),strength=Number(style[`${phase}Intensity`]??50)/50;
 let x=0,y=0,scale=1,rotate=0,opacity=1,blur=0;
 if(active&&name!=='None'){
  const delta=1-t;
  switch(name){
   case 'Reveal':opacity=t;break;
   case 'Reveal slow zoom':opacity=t;scale=1+.22*strength*delta;break;
   case 'Fade in':opacity=t*t;break;
   case 'Slide':{const d=String(style[`${phase}Direction`]||'Up');x=(d==='Left'?-1:d==='Right'?1:0)*60*strength*delta;y=(d==='Up'?-1:d==='Down'?1:0)*60*strength*delta;break}
   case 'Shrink':scale=1+strength*delta;opacity=t;break;
   case 'Bounce':scale=1+Math.sin(progress*Math.PI*3)*.22*strength*delta-.4*strength*delta;break;
   case 'Slide In':x=80*strength*delta;opacity=t;break;
   case 'Bounce In':y=-70*strength*delta+Math.sin(progress*Math.PI*4)*20*strength*delta;opacity=t;break;
   case 'Snap In':scale=1-.8*strength*delta;opacity=t>.2?1:0;break;
   case 'Blast In':scale=1+1.2*strength*delta;opacity=t;rotate=15*strength*delta;break;
   case 'Diagonal':x=-70*strength*delta;y=70*strength*delta;opacity=t;break;
   case 'Glow Reveal':opacity=t;blur=15*strength*delta;break;
  }
 }
 const visual=String(style.visualEffect||'None'),v=Number(style.visualEffectIntensity??50)/50;
 const clock=time*Number(style.visualEffectSpeed??75)/75;
 const wobble=Math.sin(clock*9)*v;
 const effect=visual==='Rainbow'?`hue-rotate(${(clock*90)%360}deg)`:visual==='RGB Shift'?`drop-shadow(${(3*v+wobble*1.5).toFixed(2)}px 0 var(--art-ff403b)) drop-shadow(${(-3*v-wobble*1.5).toFixed(2)}px 0 var(--art-207bff))`:visual==='Neon Pulse'?`drop-shadow(0 0 ${5+4*Math.sin(clock*5)}px var(--accent))`:visual==='Shake Blur'?`blur(${Math.abs(wobble)}px)`:visual==='Glow Reveal'?undefined:visual==='VHS'?`contrast(${1+.3*v}) drop-shadow(${wobble*3}px 0 var(--art-ff403b))`:visual==='Glitter'?`drop-shadow(0 0 ${3+3*Math.abs(wobble)}px var(--art-ffffff))`:visual==='Holographic'?`hue-rotate(${180+clock*60}deg) saturate(1.6)`:visual==='Wave'||visual==='Snap Wave'?`blur(${Math.abs(wobble)*.4}px)`:undefined;
 if(visual==='Wobble')rotate+=wobble*4;if(visual==='Wave')y+=wobble*3;if(visual==='Snap Wave')y+=Math.sign(wobble)*4*v;if(visual==='Floating words')y+=Math.sin(clock*3)*4*v;
 return {transform:`translate(${x.toFixed(2)}%, ${y.toFixed(2)}%) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`,opacity,filter:[blur?`blur(${blur.toFixed(2)}px)`:undefined,effect].filter(Boolean).join(' ')||undefined};
}
