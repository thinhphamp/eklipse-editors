import type { CSSProperties } from 'react';
import { aiMocks } from '../../fixtures';
import type { CaptionDocument, CaptionWord } from '../../tabs/captions/model';
import { captionMotion, captionStyle } from '../../tabs/captions/render-style';
export function CaptionWords({ group, doc, settings, time }: { group: CaptionWord[]; doc: CaptionDocument; settings: Record<string, boolean>; time: number }) {
  const style = doc.style, animation = String(style.animation || 'None');
  const wordTarget = style.animationTarget !== 'Sentence animations';
  return <>{group.map((word, i) => {
    const elapsed = time * 1000 - word.startMs;
    const active = elapsed >= 0 && time * 1000 < word.endMs;
    const index = word.fixtureIndex ?? doc.words.indexOf(word);
    const s: CSSProperties = { display: 'inline-block', ...captionMotion(wordTarget ? animation : 'None', elapsed), verticalAlign: 'baseline' };
    if (active && style.highlight !== 'None') {
      const overrides = Object.fromEntries(Object.entries(style).filter(([key]) => key.startsWith('highlight') && !['highlight', 'highlightColor'].includes(key)).map(([key, value]) => [key[9].toLowerCase() + key.slice(10), value]));
      if (Object.keys(overrides).length) {
        const look = captionStyle({ ...style, ...overrides });
        if ('stroke' in overrides || 'strokeWidth' in overrides) s.WebkitTextStroke = look.WebkitTextStroke;
        if (['shadow', 'shadowX', 'shadowY', 'shadowBlur', 'glow', 'glowRadius', 'extraStroke', 'extraStrokeWidth'].some(key => key in overrides)) s.textShadow = look.textShadow;
        if ('background' in overrides) s.background = look.background;
        if ('backgroundRadius' in overrides) s.borderRadius = look.borderRadius;
        if ('opacity' in overrides) s.opacity = Number(s.opacity ?? 1) * Number(overrides.opacity) / 100;
      }
      if (style.highlight === 'Color' || animation === 'Highlight') s.color = String(style.highlightColor);
      if (style.highlight === 'Underline' || animation === 'Underline' || animation === 'Scale underline') {
        s.textDecoration = 'underline'; s.textDecorationColor = String(style.highlightColor); s.textUnderlineOffset = '.12em';
        if (animation === 'Scale underline') s.transform = `scale(${1 + Math.min(1, elapsed / 200) * .12})`;
      }
      if (style.highlight === 'Pill') { s.background = String(style.highlightBackground || style.highlightColor); s.color = String(style.fill); s.borderRadius = '.15em'; }
    }
    if (settings['Multiple speakers']) {
      const speaker = doc.speakers.find(sp => sp.id === word.speaker);
      if (speaker) s.borderBottom = `.035em solid ${speaker.color}`;
      if (speaker?.styled && (!active || style.highlight === 'None')) s.color = speaker.color;
    }
    if (settings['AI Supersize'] && aiMocks.aiSupersize.includes(index)) s.fontSize = '1.35em';
    const rotation = settings['Random rotation'] ? (index % 5 - 2) * 4 : 0;
    if (settings['AI Shake'] && aiMocks.aiShake.includes(index) && active) s.transform = `translate(${Math.sin(time * 95) * 3}px,${Math.cos(time * 80) * 2}px) rotate(${rotation}deg)`;
    else if (rotation) s.rotate = `${rotation}deg`;
    if (animation === 'One word at a time' && !active) s.display = 'none';
    if (animation === 'Typewriter' && elapsed < 0) s.visibility = 'hidden';
    const text = settings['Hide Punctuation'] ? word.text.replace(/[,.!?]/g, '') : word.text;
    const count = animation === 'Typewriter' ? Math.max(0, Math.min(text.length, Math.ceil(elapsed / Math.max(1, word.endMs - word.startMs) * text.length))) : text.length;
    return <span key={`${i}-${word.startMs}`}><span data-word-index={index} className={active ? 'caption-active' : ''} style={s}>{text.slice(0, count)}</span>{i < group.length - 1 ? ' ' : ''}</span>;
  })}</>;
}
