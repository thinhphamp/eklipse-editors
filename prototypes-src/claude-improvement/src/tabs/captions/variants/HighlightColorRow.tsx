import { cssVar } from '../../../theme/css-var';
import type { CaptionDocument } from '../model';
import './highlight-color-row.css';

// Variant cap-highlight-color: spoken-word highlight swatches right on the Captions panel.
// Stores the resolved colour, like the Fill swatches in StyleFields, so the C3 checkpoint matches.
const swatches: [string, string][] = [['White', '--text-1'], ['Yellow', '--art-ffff81'], ['Pink', '--art-fa90df'], ['Green', '--art-b3ff42'], ['Cyan', '--art-b5f7ff'], ['Purple', '--art-ab60fa']];
export function HighlightColorRow({ doc, update }: { doc: CaptionDocument; update: (doc: CaptionDocument, label: string) => void }) {
  const current = doc.style.highlight === 'Color' ? String(doc.style.highlightColor || '') : '';
  return <div className="captions-hl-row" role="group" aria-label="Highlight colour">
    <span>Highlight colour</span>
    <div>{swatches.map(([name, token]) => <button key={token} aria-label={`Highlight colour ${name}`} aria-pressed={current.toLowerCase() === cssVar(token).toLowerCase()}
      style={{ background: `var(${token})` }} onClick={() => update({ ...doc, style: { ...doc.style, highlight: 'Color', highlightColor: cssVar(token) } }, 'Set caption highlight colour')} />)}</div>
  </div>;
}
