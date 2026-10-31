import { useState } from 'react';
import { LayoutCanvas } from '../shell/LayoutCanvas';
import { Icon } from '../ui/Icon';
import { loadOptions, openScenario, scenarios, type Scenario } from './scenarios';
import './start.css';

// Review entry for "start from app.eklipse.gg": pick what the chosen template carries, then open the editor.
const lanes = (s: Scenario) => [
  { name: 'Video', kind: 'video', note: 'At open' },
  { name: 'Captions', kind: s.captionPreset ? 'running' : 'off', note: s.captionPreset ? 'Generating after open' : 'Not in template' },
  { name: 'Channel name', kind: s.channel ? 'sticker' : 'off', note: s.channel ? 'At open' : 'Not in template' },
];

function ScenarioCard({ s, onOpen }: { s: Scenario; onOpen: () => void }) {
  return <article className="sp-card">
    <div className="sp-thumb">
      <LayoutCanvas layout={s.layout} thumbnail />
      {s.channel && <i className="sp-sticker">thinhsocial</i>}
      {s.captionPreset && <i className="sp-caption">{s.captionPreset}</i>}
    </div>
    <div className="sp-body">
      <span className="sp-template">Template · {s.template}</span>
      <h2>{s.title}</h2>
      <p>{s.what}</p>
      <ul className="sp-lanes" aria-label="What the timeline gets">
        {lanes(s).map(l => <li key={l.name} className={l.kind}><span>{l.name}</span><i /><small>{l.note}</small></li>)}
      </ul>
      <button className="sp-open" onClick={onOpen}>Open in editor <Icon name="arrow-left" size={14} /></button>
    </div>
  </article>;
}

export function StartPicker() {
  const [ms, setMs] = useState(2000);
  const [fail, setFail] = useState(false);
  return <div className="sp-shell">
    <header className="sp-head">
      <Icon name="eklipse-logo" size={30} />
      <div>
        <span className="sp-eyebrow">Start from app.eklipse.gg</span>
        <h1>Which template did the user pick?</h1>
        <p>The user chose a clip and a template in the web app. The editor opens with the video track only, shows a waiting screen while the clip loads, then the template lands.</p>
      </div>
    </header>
    <div className="sp-load" aria-label="Review options">
      <span>Loading time</span>
      {loadOptions.map(o => <button key={o.ms} role="radio" aria-checked={ms === o.ms} className={ms === o.ms ? 'on' : ''} onClick={() => setMs(o.ms)}>{o.label}</button>)}
      <span className="sp-gap">Captions result</span>
      {([['Ready', false], ['Fails', true]] as const).map(([label, v]) => <button key={label} role="radio" aria-checked={fail === v} className={fail === v ? 'on' : ''} onClick={() => setFail(v)}>{label}</button>)}
    </div>
    <div className="sp-grid">{scenarios.map(s => <ScenarioCard key={s.id} s={s} onOpen={() => openScenario(s.id, ms, fail)} />)}</div>
  </div>;
}
