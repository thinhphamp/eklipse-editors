import { cssVar } from '../../../theme/css-var';
import type { CaptionDocument } from '../model';
import './highlight-color-row.css';

// Variant cap-highlight-color: spoken-word highlight swatches right on the Captions panel.
// v3: stores `var(--art-…)` like the preset editor (PresetEditor.tsx), so both paths save the same value.
const swatches: [string, string][] = [['White', '--art-ffffff'], ['Yellow', '--art-ffff81'], ['Pink', '--art-fa90df'], ['Green', '--art-b3ff42'], ['Cyan', '--art-b5f7ff'], ['Purple', '--art-ab60fa']];
export function HighlightColorRow({ doc, update }: { doc: CaptionDocument; update: (doc: CaptionDocument, label: string) => void }) {
  const current = doc.style.highlight === 'Color' ? String(doc.style.highlightColor || '') : '';
  return <div className="captions-hl-row" role="group" aria-label="Highlight colour">
    <span>Highlight colour</span>
    <div>{swatches.map(([name, token]) => <button key={token} aria-label={`Highlight colour ${name}`} aria-pressed={current === `var(${token})` || current.toLowerCase() === cssVar(token).toLowerCase()}
      style={{ background: `var(${token})` }} onClick={() => update({ ...doc, style: { ...doc.style, highlight: 'Color', highlightColor: `var(${token})` } }, 'Set caption highlight colour')} />)}</div>
  </div>;
}
