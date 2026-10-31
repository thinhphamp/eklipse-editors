import { useEffect, useState } from 'react';
import { cancelCaptionJob, captionJobProgress, captionJobSecondsLeft } from './caption-job';

/** Captions panel while the job runs: production's "Making magic…" screen on the dark editor (W3). */
export function CaptionMagic() {
  const [, tick] = useState(0);
  useEffect(() => { const id = window.setInterval(() => tick(n => n + 1), 250); return () => window.clearInterval(id); }, []);
  const p = captionJobProgress();
  return <div className="cap-d1-magic" role="status" aria-live="polite">
    <img src="media/making-magic.png" alt="" />
    <h2>Making magic…</h2>
    <p>This might take up to 30 seconds, depending on the length of your clip.</p>
    <div className="cap-d1-magic-bar" aria-label={`${Math.round(p * 100)}% done`}><i style={{ width: `${Math.round(p * 100)}%` }} /></div>
    <small>about {captionJobSecondsLeft()} s left</small>
    <div className="cap-d1-magic-info"><span aria-hidden="true">i</span><p>You can keep working on your project while we generate the captions. We'll let you know when they're ready.</p></div>
    <button className="cap-d1-magic-cancel" onClick={cancelCaptionJob}>Cancel</button>
  </div>;
}
export function CaptionJobFailed({ retry, back }: { retry: () => void; back: () => void }) {
  return <div className="cap-d1-empty cap-d1-failed"><b>Couldn't generate captions</b>Something went wrong on our side. Your choices are kept.<div><button onClick={back}>Back to setup</button><button className="captions-primary" onClick={retry}>Try again</button></div></div>;
}
