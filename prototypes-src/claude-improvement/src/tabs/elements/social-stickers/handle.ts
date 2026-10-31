import { useSyncExternalStore } from 'react';

// The handle typed above the Social Stickers gallery; shared by the gallery and the Elements panel preview (real time).
let handle = 'thinhsocial';
const listeners = new Set<() => void>();
export function setStickerHandle(value: string) { handle = value; listeners.forEach(fn => fn()); }
export function useStickerHandle() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn); }, () => handle);
}
