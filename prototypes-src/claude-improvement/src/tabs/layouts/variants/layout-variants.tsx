import type { ReactNode } from 'react';
import { hasVariant } from '../../../variant';
import './layout-variants.css';
/** Probe variants for the Layouts panel top. Both only apply when a saved style exists and its layout differs from
 *  the last exported layout; otherwise the panel renders exactly as the approved version. */
export type LayoutVariant = 'style-lastclip' | 'recent-first' | null;
export function layoutVariant(styleLayout: string | undefined, last: string | undefined): LayoutVariant {
  if (!styleLayout || !last || styleLayout === last) return null;
  if (hasVariant('style-lastclip')) return 'style-lastclip';
  if (hasVariant('recent-first')) return 'recent-first';
  return null;
}
/** Variant 1: one line and a secondary button under the style card. */
export function LastClipLine({ last, onUse }: { last: string; onUse: () => void }): ReactNode {
  return <div className="sq-lastclip"><span>Your last clip used <strong>{last}</strong></span><button onClick={onUse}>Use {last}</button></div>;
}
export const LAST_BADGE = <span className="last-badge">last</span>;
