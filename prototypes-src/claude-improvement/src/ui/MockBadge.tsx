import './mock-badge.css';
// Marks a feature that runs on local fixtures instead of the real AI API (plan decision D5).
export function MockBadge({ note = 'Runs on demo fixtures; the real editor calls the AI API.' }: { note?: string }) {
  return <span className="mock-badge" title={note}>Mock API</span>;
}
/** Fake network latency for mock AI calls. */
export const mockDelay = (ms = 800) => new Promise<void>(resolve => window.setTimeout(resolve, ms));
