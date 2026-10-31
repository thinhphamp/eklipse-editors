import type { CSSProperties } from 'react';
export function letterFrame(name:string,elapsed:number,index:number,visual:string='None'):CSSProperties{
 const p=Math.max(0,Math.min(1,(elapsed-index*.07)/.55)),t=p*p*(3-2*p),d=1-t;
 const oscillate=Math.sin((elapsed-index*.08)*9)*Math.max(0,1-elapsed/1.5);
 let x=0,y=0,scale=1,rotate=0,opacity=name==='None'?1:t;
 switch(name){
 case 'None':break;case 'Stick':x=-12*d;break;case 'Appear':break;case 'Land':y=-30*d;break;case 'Pop':scale=1+.8*d;break;
 case 'Slide':x=-25*d;break;case 'Unfold':scale=.2+.8*t;break;case 'Emerge':y=20*d;break;
 case 'Burst':scale=1+1.5*d;rotate=30*d;break;case 'Rotate':rotate=360*d;break;case 'Jump':y=-15*d+oscillate*4;break;
 case 'Shrink':scale=1+.8*d;break;case 'Glide':x=35*d;break;case 'Flip':rotate=180*d;break;case 'Float':y=15*d+oscillate*4;break;
 case 'Impact':scale=.5+.5*t;break;case 'Hop':y=-20*d+oscillate*5;break;case 'Drift':x=20*d;y=-12*d;break;
 case 'Sway':rotate=15*d+oscillate*4;break;case 'Groove':y=oscillate*8;break;case 'Bounce':scale=.5+.5*t+oscillate*.15;break;
 case 'Shake':x=oscillate*6;break;case 'Whirl':rotate=720*d;scale=.5+.5*t;break;
 }
 if(visual==='Floating words')y+=Math.sin(elapsed*3+index*1.4)*6;
 if(visual==='Wave')y+=Math.sin(elapsed*5+index*.8)*5;
 if(visual==='Snap Wave')y+=Math.sign(Math.sin(elapsed*6+index)) *5;
 if(visual==='Wobble')rotate+=Math.sin(elapsed*4+index)*7;
 return {display:'inline-block',opacity,transform:`translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`};
}
