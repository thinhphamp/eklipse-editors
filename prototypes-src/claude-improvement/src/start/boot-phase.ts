import { useSyncExternalStore } from 'react';

// Where a "start from app" clip is: loading (waiting screen), captions (open, captions still generating),
// failed (caption job failed, retry offered), done.
export type BootPhase = 'loading' | 'captions' | 'failed' | 'done';
let phase: BootPhase = 'done';
let captionsSince = 0;
const listeners = new Set<() => void>();
export function setBootPhase(p: BootPhase) {
  phase = p; if (p === 'captions') captionsSince = performance.now();
  document.documentElement.classList.toggle('ek-booting', p === 'loading');
  document.documentElement.classList.toggle('ek-captions-running', p === 'captions');
  document.documentElement.classList.toggle('ek-captions-failed', p === 'failed');
  listeners.forEach(l => l());
}
export const captionsStartedAt = () => captionsSince;
export const useBootPhase = () => useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => phase);
export const getBootPhase = () => phase;
