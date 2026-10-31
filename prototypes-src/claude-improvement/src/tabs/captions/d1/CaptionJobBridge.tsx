import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../../../state';
import { initialWords, readCaption, writeCaption } from '../model';
import { captionJobFails, captionJobProgress, captionJobSecondsLeft, failCaptionJob, finishCaptionJob, getCaptionJob, markCaptionJobSeen, queueExportAfterCaptions, startCaptionJob, useCaptionJob } from './caption-job';
import './caption-job.css';

/** Always mounted with the editor shell (W3): finishes the caption job on any tab, drives the ring on the Captions rail
 *  icon, shows "ready" / "failed" toasts off the Captions tab and asks what to do when Export is pressed mid-job. */
export function CaptionJobBridge() {
  const { state, actions } = useEditor(); const job = useCaptionJob();
  const latest = useRef(state); latest.current = state;
  const [toast, setToast] = useState<'' | 'ready' | 'fail'>(''); const [ask, setAsk] = useState(false); const bypass = useRef(false); const [, tick] = useState(0);
  // Progress clock + finish / fail, whichever tab is open.
  useEffect(() => {
    if (job.phase !== 'run') return;
    const id = window.setInterval(() => {
      const p = captionJobProgress(), s = latest.current, onTab = s.activeTab === 'Captions';
      if (captionJobFails() && p >= .55) { failCaptionJob(onTab); if (!onTab) setToast('fail'); return; }
      if (p >= 1) {
        const doc = readCaption(s.captions); const queued = getCaptionJob().queuedExport;
        actions.commit({ captions: { ...writeCaption(s.captions, { ...doc, words: initialWords(), style: { ...doc.style, language: getCaptionJob().language } }), generated: true }, detachedCaptionSegments: [] }, 'Generate captions');
        finishCaptionJob(onTab);
        if (queued) { queueExportAfterCaptions(false); bypass.current = true; actions.patch({ modal: 'export' }); actions.notify('Captions are ready, export started'); }
        else if (!onTab) setToast('ready'); else actions.notify('Captions ready');
        return;
      }
      tick(n => n + 1);
    }, 250);
    return () => window.clearInterval(id);
  }, [job.phase, actions]);
  // Rail ring / dots: CSS reads these from <html>, no change to the rail component.
  const p = captionJobProgress();
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--cj-p', String(p));
    root.classList.toggle('cj-run', job.phase === 'run');
    root.classList.toggle('cj-ready', job.phase === 'done' && !job.seen);
    root.classList.toggle('cj-fail', job.phase === 'fail' && !job.seen);
    const btn = document.querySelector<HTMLElement>('.rail [data-tab="Captions"]');
    if (btn) btn.title = job.phase === 'run' ? `Generating captions · ${Math.round(p * 100)}%` : job.phase === 'done' && !job.seen ? 'Captions ready' : job.phase === 'fail' && !job.seen ? "Captions couldn't be generated" : '';
  });
  // Opening the Captions tab clears the dot and the toast.
  useEffect(() => { if (state.activeTab === 'Captions') { markCaptionJobSeen(); setToast(''); } }, [state.activeTab]);
  // Export while captions are still generating: ask first.
  useEffect(() => {
    if (state.modal !== 'export') { bypass.current = false; return; }
    if (job.phase === 'run' && !bypass.current) { actions.patch({ modal: '' }); setAsk(true); }
  }, [state.modal, job.phase, actions]);
  // The job can end while the ask dialog is open: close it, and open Export when captions made it (the user pressed Export).
  const openExport = () => { bypass.current = true; actions.patch({ modal: 'export' }); };
  useEffect(() => {
    if (!ask || job.phase === 'run') return;
    setAsk(false);
    if (job.phase === 'done') { openExport(); actions.notify('Captions are ready, export started'); }
  }, [ask, job.phase]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>
    {toast && <div className={`cj-toast ${toast === 'fail' ? 'fail' : ''}`} role="status">
      <span>{toast === 'ready' ? 'Captions are ready · added to your video' : "Couldn't generate captions"}</span>
      {toast === 'ready'
        ? <button className="cj-acc" onClick={() => actions.chooseTab('Captions')}>Review</button>
        : <button className="cj-acc" onClick={() => { setToast(''); startCaptionJob(getCaptionJob().language); }}>Try again</button>}
      <button aria-label="Dismiss" onClick={() => setToast('')}>×</button>
    </div>}
    {ask && <div className="cj-shade" onMouseDown={() => setAsk(false)}><div className="cj-dialog" role="dialog" aria-modal="true" aria-label="Captions are still generating" onMouseDown={e => e.stopPropagation()}>
      <b>Captions are still generating</b>
      <p>About {captionJobSecondsLeft()} s left. Wait and export with captions, or export now without them.</p>
      <div><button onClick={() => { setAsk(false); openExport(); }}>Export without captions</button>
        <button className="cj-acc" onClick={() => {
          setAsk(false);
          // Captions may have finished a moment ago: export now instead of queueing for a job that already ended.
          if (getCaptionJob().phase !== 'run') { openExport(); return; }
          queueExportAfterCaptions(true); actions.notify('Export will start when captions are ready');
        }}>Wait, then export</button></div>
    </div></div>}
  </>;
}
