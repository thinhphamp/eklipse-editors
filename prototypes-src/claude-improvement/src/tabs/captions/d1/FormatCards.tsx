import { Switch as CaptionSwitch } from '../StyleConfigure';

/** "Show captions as": Word by word / Full phrases (production wording). */
export function FormatCards({ words, set }: { words: boolean; set: (words: boolean) => void }) {
  return <div className="cap-d1-format" role="radiogroup" aria-label="Show captions as">
    {([[true, 'Word by word', 'One word pops at a time', ['GO']], [false, 'Full phrases', 'Grouped, easy to read', ['GO', 'GO', 'PEEK']]] as const).map(([value, label, hint, demo]) =>
      <button key={label} role="radio" aria-checked={words === value} className={words === value ? 'active' : ''} onClick={() => set(value)}>
        <span className="cap-d1-format-demo" aria-hidden="true">{demo.map((w, i) => <i key={i} className={i === 0 ? 'on' : ''}>{w}</i>)}</span>
        <b>{label}</b><small>{hint}</small>
      </button>)}
  </div>;
}
export function EmojiCard({ on, set }: { on: boolean; set: (on: boolean) => void }) {
  return <button className="cap-d1-option" aria-pressed={on} onClick={() => set(!on)}>
    <span className="captions-effect-icon">🙂</span><span className="captions-effect-copy"><b>Auto emoji</b><small>Match the moment with 🔥 💀 🎯</small></span><CaptionSwitch checked={on} />
  </button>;
}
