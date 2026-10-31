import { useEffect, useState } from 'react';

type Tip = { text: string; keys: string[]; x: number; y: number; below: boolean };
export function TooltipLayer() {
  const [tip, setTip] = useState<Tip|null>(null);
  useEffect(() => {
    let timer = 0;
    let target: HTMLElement|null = null;
    const clear = () => { window.clearTimeout(timer); setTip(null); target = null; };
    const show = (event: Event) => {
      const node = (event.target as HTMLElement).closest<HTMLElement>('[title],[data-tip]');
      if (!node || node === target) return;
      clear(); target = node;
      const native = node.getAttribute('title');
      if (native) { node.dataset.tip = native; if (!node.getAttribute('aria-label')) node.setAttribute('aria-label', native); node.removeAttribute('title'); }
      const value = node.dataset.tip;
      if (!value) return;
      timer = window.setTimeout(() => {
        const rect = node.getBoundingClientRect();
        setTip({ text: value, keys: (node.dataset.keys || '').split('|').filter(Boolean), x: Math.max(16, Math.min(innerWidth-16, rect.left+rect.width/2)), y: rect.top < 65 ? rect.bottom+9 : rect.top-9, below: rect.top < 65 });
      }, 0); // shown immediately on hover, as in the reference editor
    };
    document.addEventListener('pointerover', show); document.addEventListener('focusin', show);
    document.addEventListener('pointerout', clear); document.addEventListener('focusout', clear);
    document.addEventListener('pointerdown', clear); window.addEventListener('scroll', clear, true);
    return () => { clear(); document.removeEventListener('pointerover', show); document.removeEventListener('focusin', show); document.removeEventListener('pointerout', clear); document.removeEventListener('focusout', clear); document.removeEventListener('pointerdown', clear); window.removeEventListener('scroll', clear, true); };
  }, []);
  return tip && <div role="tooltip" className={'ek-tooltip'+(tip.below?' below':'')} style={{left:tip.x,top:tip.y}}><span>{tip.text}</span>{tip.keys.map((key,i)=><span className="tip-key-wrap" key={i}>{i>0&&<small>or</small>}<kbd>{key}</kbd></span>)}</div>;
}
