import { useEffect, useState } from 'react';
import { getEngine } from './playback-engine';

export const DEMO_POSTER = 'media/demo-poster.jpg';
let poster: HTMLImageElement|null = null;

/** Still frame used by layout thumbnails and before the video has data. */
export function usePoster(): HTMLImageElement|null {
  const [ready, setReady] = useState(() => !!poster?.complete && !!poster.naturalWidth);
  useEffect(() => {
    if (!poster) { poster = new Image(); poster.src = DEMO_POSTER; }
    if (poster.complete && poster.naturalWidth) { setReady(true); return; }
    const done = () => setReady(true);
    poster.addEventListener('load', done);
    return () => poster?.removeEventListener('load', done);
  }, []);
  return ready ? poster : null;
}

/** Current video frame when the clip has data, otherwise the poster. */
export function liveSource(fallback: HTMLImageElement|null): CanvasImageSource|null {
  const engine = getEngine();
  return engine.ready ? engine.video : fallback;
}
