import { useEffect, useRef, useState } from 'react';
import { captionsStartedAt, setBootPhase as setPhase, useBootPhase as usePhase } from './boot-phase';
import { createPortal } from 'react-dom';
import { useEditor } from '../state';
import { Icon } from '../ui/Icon';
import { withBrandSticker } from '../shell/brand-sticker';
import { initialWords, presetStyle, writeCaption } from '../tabs/captions/model';
import { transcript } from '../fixtures';
import { captionJobMs, captionsFail, loadMs, type Scenario } from './scenarios';
import './start.css';

// Waiting screen + template arrival for "start from app.eklipse.gg". The editor shell renders at once (rail, top bar,
// video-only timeline); the stage shows the clip loading and the panel a skeleton. When the clip is ready the template
// parts land without an undo step (they are the starting point, not an edit). Captions keep running after that.

/** Waits for a selector to exist (panels and lanes mount after the first paint). */
function useHost(selector: string, deps: unknown[]) {
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => {
    let raf = 0; const find = () => { const el = document.querySelector(selector); if (el) setHost(el); else raf = requestAnimationFrame(find); };
    find(); return () => cancelAnimationFrame(raf);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return host?.isConnected ? host : null;
}

function useElapsed(running: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => { if (!running) return; const t0 = performance.now(); let raf = 0; const tick = () => { setT(performance.now() - t0); raf = requestAnimationFrame(tick); }; tick(); return () => cancelAnimationFrame(raf); }, [running]);
  return t;
}

function LoadingCard({ scenario, total }: { scenario: Scenario; total: number }) {
  const t = useElapsed(true);
  const steps: { label: string; detail: string; until: number }[] = [
    { label: 'Loading clip', detail: 'Valorant clutch · 1:00', until: .55 },
    { label: 'Applying layout', detail: scenario.layout, until: scenario.channel ? .8 : 1 },
    ...(scenario.channel ? [{ label: 'Adding channel name', detail: 'thinhsocial', until: 1 }] : []),
  ];
  const p = Math.min(1, t / total);
  const slow = t > 4000;
  return <div className="sb-card" role="status" aria-live="polite">
    <span className="sb-eyebrow">From app.eklipse.gg</span>
    <h2>Opening your clip</h2>
    <span className="sb-template"><Icon name="layouts" size={14} /> Template · <b>{scenario.template}</b></span>
    <ol className="sb-steps">
      {steps.map((s, i) => { const from = i ? steps[i - 1].until : 0; const state = p >= s.until ? 'done' : p >= from ? 'now' : 'next';
        return <li key={s.label} className={state}><i>{state === 'done' ? <Icon name="check" size={12} /> : null}</i><span>{s.label}</span><small>{s.detail}</small></li>; })}
      {scenario.captionPreset && <li className="later"><i /><span>Captions</span><small>Start when the clip is open</small></li>}
    </ol>
    <div className="sb-bar"><span style={{ transform: `scaleX(${.06 + .94 * (1 - Math.pow(1 - p, 2))})` }} /></div>
    <p className="sb-note">{slow ? 'Taking longer than usual. Your clip is still loading.' : 'Your template is applied as soon as the clip is ready.'}</p>
  </div>;
}

function PanelSkeleton() {
  return <div className="sb-panel" aria-hidden="true">
    <span className="sb-sk w40 h18" /><span className="sb-sk w70 h12" />
    <div className="sb-sk-row"><span className="sb-sk pill" /><span className="sb-sk pill" /><span className="sb-sk pill" /></div>
    <div className="sb-sk-grid">{Array.from({ length: 6 }, (_, i) => <span key={i} className="sb-sk tile" />)}</div>
  </div>;
}

function CaptionLaneProgress() {
  useElapsed(true);
  const p = Math.min(.96, (performance.now() - captionsStartedAt()) / captionJobMs);
  return <div className="sb-lane"><span className="sb-lane-fill" style={{ width: `${Math.round(p * 100)}%` }} /><b>Generating captions…</b></div>;
}

export function StartBoot({ scenario }: { scenario: Scenario }) {
  const { state, actions } = useEditor();
  const current = usePhase();
  const total = loadMs();
  const latest = useRef(state); latest.current = state;
  const retried = useRef(false);
  const retry = () => { retried.current = true; setPhase('captions'); };

  useEffect(() => {
    setPhase('loading');
    const ready = window.setTimeout(() => {
      const s = latest.current;
      const parts = [scenario.channel && 'channel name added'].filter(Boolean).join('');
      if (scenario.channel) actions.patch({ elements: withBrandSticker({ elements: s.elements, duration: s.duration }) });
      if (scenario.captionPreset) {
        actions.patch({ toast: `Clip ready${parts ? ' · ' + parts : ''} · captions are generating in “${scenario.captionPreset}” preset of style` });
        setPhase('captions');
      } else {
        actions.patch({ toast: `Template “${scenario.template}” applied${parts ? ' · ' + parts : ''}` });
        setPhase('done');
      }
    }, total);
    return () => { window.clearTimeout(ready); setPhase('done'); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (current !== 'captions' || !scenario.captionPreset) return;
    // First run fails when the review switch asks for it; Retry always succeeds.
    const fail = captionsFail() && !retried.current;
    const done = window.setTimeout(() => {
      if (fail) { actions.patch({ toast: 'Couldn’t generate captions · the rest of your template is applied' }); setPhase('failed'); return; }
      const caption = { ...latest.current.captions, preset: scenario.captionPreset!, generated: true };
      actions.patch({
        captions: writeCaption(caption, { words: initialWords(), y: 75, width: 82, style: { ...presetStyle(scenario.captionPreset!, scenario.captionFlavor), presetFlavor: scenario.captionFlavor || 'comic' }, speakers: transcript.speakers }),
        detachedCaptionSegments: [], toast: 'Captions ready · 14 lines',
      });
      setPhase('done');
    }, captionJobMs);
    return () => window.clearTimeout(done);
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const stage = useHost('.editor-main .stage', [current]);
  const panel = useHost('.side-panel', [current]);
  const lane = useHost('.timeline .captions-lane', [current, state.activeTab]);
  const phone = useHost('.phone-preview', [current, state.layoutId]);
  return <>
    {current === 'loading' && stage && createPortal(<div className="sb-stage"><LoadingCard scenario={scenario} total={total} /></div>, stage)}
    {current === 'loading' && panel && createPortal(<PanelSkeleton />, panel)}
    {current === 'captions' && lane && createPortal(<CaptionLaneProgress />, lane)}
    {current === 'captions' && phone && createPortal(<span className="sb-phone-pill"><i className="sb-spin" />Captions on the way</span>, phone)}
    {current === 'captions' && state.activeTab === 'Captions' && panel && createPortal(<div className="sb-cap-panel">
      <i className="sb-spin big" /><h3>Generating captions</h3>
      <p>Using the <b>{scenario.captionPreset}</b> preset of style from your template. Keep editing; they appear on the clip when ready.</p>
    </div>, panel)}
    {current === 'failed' && lane && createPortal(<div className="sb-lane failed"><b>Couldn’t generate captions</b><button onClick={retry}>Try again</button></div>, lane)}
    {current === 'failed' && state.activeTab === 'Captions' && panel && createPortal(<div className="sb-cap-panel">
      <span className="sb-fail-mark" aria-hidden="true">!</span><h3>Couldn’t generate captions</h3>
      <p>Your layout{scenario.channel ? ' and channel name are' : ' is'} still applied. Try again, or set up captions yourself.</p>
      <div className="sb-cap-actions"><button className="sb-primary" onClick={retry}>Try again</button><button onClick={() => setPhase('done')}>Set up captions</button></div>
    </div>, panel)}
  </>;
}
