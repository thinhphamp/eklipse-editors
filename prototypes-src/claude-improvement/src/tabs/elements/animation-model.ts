export const animationNames=['None','Reveal','Reveal slow zoom','Fade in','Slide','Shrink','Bounce','Slide In','Bounce In','Snap In','Blast In','Diagonal','Glow Reveal'] as const;
export const letterNames=['None','Stick','Appear','Land','Pop','Slide','Unfold','Emerge','Burst','Rotate','Jump','Shrink','Glide','Flip','Float','Impact','Hop','Drift','Sway','Groove','Bounce','Shake','Whirl'] as const;
export const visualNames=['None','Rainbow','RGB Shift','VHS','Glitter','Holographic','Neon Pulse','Wave','Snap Wave','Floating words','Shake Blur','Wobble'] as const;
export function defaultAnimation(category?:string){return category==='Text Elements'?'Slide':category==='Reactions'||category==='Twitch Emotes'?'Reveal':'Reveal slow zoom'}
