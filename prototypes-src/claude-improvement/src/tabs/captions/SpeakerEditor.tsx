import { useState } from 'react';
import type { CaptionDocument } from './model';
import { useEditor } from '../../state';
import { Segmented, Switch } from './StyleConfigure';
export function SpeakerEditor({ doc, update, settings, setEffect }: { doc: CaptionDocument; update: (doc: CaptionDocument, label: string) => void; settings: Record<string, boolean>; setEffect: (name: string, value: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null); const { actions } = useEditor();
  const setSpeaker = (index: number, change: { name?: string; color?: string }) => update({ ...doc, speakers: doc.speakers.map((speaker, i) => i === index ? { ...speaker, ...change, ...(change.color ? { styled: true } : {}) } : speaker) }, 'Edit caption speaker');
  return <>{['Multiple speakers', 'Emojis', 'Speaker avatars'].map(name => {
    const other = name === 'Emojis' ? 'Speaker avatars' : 'Emojis', blocked = name !== 'Multiple speakers' && settings[other];
    return <div className="captions-speaker-config" key={name}><button className="captions-config-toggle" onClick={() => blocked ? actions.notify(`Turn off ${other} first`) : setEffect(name, !settings[name])}><span><b>{name}</b><small>{blocked ? `Can't be used with ${other}` : name === 'Multiple speakers' ? 'Assign unique styles per speaker' : name === 'Emojis' ? 'Show an emoji next to your captions' : 'Show your speakers’ avatars next to your captions'}</small></span><Switch checked={!!settings[name]} /></button>
      {name === 'Speaker avatars' && settings[name] && <><small>Avatar position</small><Segmented items={['Top', 'Bottom', 'Left', 'Right']} value={String(doc.style.avatarPosition || 'Bottom')} set={value => update({ ...doc, style: { ...doc.style, avatarPosition: value } }, 'Position caption avatars')} /></>}
    </div>;
  })}<div className="captions-speaker-list">{doc.speakers.map((speaker, index) => <div className="captions-speaker-entry" key={speaker.id}>
    <button onClick={() => setSelected(selected === index ? null : index)}><i style={{ background: speaker.color }}>Sp</i><span><b>{speaker.name}</b><small>Active preset</small></span><strong style={{ color: speaker.color }}>AA</strong><em>{selected === index ? '⌃' : '⌄'}</em></button>
    {selected === index && <div className="captions-speaker-detail"><label>Name<input aria-label={`Speaker ${index + 1} name`} value={speaker.name} onChange={event => setSpeaker(index, { name: event.target.value })} /></label><label>Color<input aria-label={`Speaker ${index + 1} color`} value={speaker.color} onChange={event => setSpeaker(index, { color: event.target.value })} /></label></div>}
  </div>)}</div><button className="captions-add-speaker" onClick={() => {
    const count = doc.speakers.length + 1; update({ ...doc, speakers: [...doc.speakers, { id: `custom-${Date.now()}`, name: `Speaker ${count}`, color: 'var(--accent-text)' }] }, 'Add caption speaker'); setSelected(count - 1);
  }}>＋ Add speaker</button></>;
}
