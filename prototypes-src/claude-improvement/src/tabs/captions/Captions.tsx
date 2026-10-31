import { useEffect, useRef, useState } from 'react';
import { PanelHeader } from '../../shell/PanelHeader';
import { useEditor } from '../../state';
import { StyleEditor } from './StyleEditor';
import { presetGroups, effectNames, effectDescriptions, effectIcons, type Preset } from './catalog';
import { initialWords, presetStyle, readCaption, writeCaption, type CaptionDocument, type CaptionStyle } from './model';
import { MockBadge } from '../../ui/MockBadge';
import { Icon } from '../../ui/Icon';
import { usePremium } from '../../ui/premium';
import { TranscriptEditor } from './TranscriptEditor';
import { Switch as CaptionSwitch, Segmented } from './StyleConfigure';
import './Captions.css';
import './caption-controls.css';
import { LookSaveAction } from '../export/LookSaveAction';
import { hasVariant } from '../../variant';
import { HighlightColorRow } from './variants/HighlightColorRow';
import { CaptionSetup, captionLanguages } from './d1/CaptionSetup';
import { CaptionLines } from './d1/CaptionLines';
import { PresetEditor } from './d1/PresetEditor';
import { PresetTile } from './d1/PresetTile';
import { EmojiCard, FormatCards } from './d1/FormatCards';
import { loadSavedStyles, presetOnly, readDefaults, rememberDefaults, storeSavedStyles, withPreset, withSaved, type SavedStyle as D1Saved } from './d1/presets';
import './d1/d1.css';
import { CaptionJobFailed, CaptionMagic } from './d1/CaptionMagic';
import { cancelCaptionJob, startCaptionJob, useCaptionJob } from './d1/caption-job';
export { CaptionSwitch };
type SavedStyle = { name: string; style: CaptionStyle };
export function Captions() {
  const { state, actions } = useEditor(); const premium=usePremium(); const screen = state.screenId; const doc = readCaption(state.captions);
  const seeded=useRef(false); const latest = useRef({ state, doc }); latest.current = { state, doc };
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [tab, setTab] = useState(['C04', 'C05', 'C06', 'C07', 'C08'].includes(screen) ? 'Effects' : /^C(09|1)|^x(1[6-9]|20)/.test(screen) ? 'Presets' : 'Text');
  const [modal, setModal] = useState(['C11', 'C12', 'C13', 'C14', 'x17', 'x18', 'x19', 'x20'].includes(screen));
  const [modalTab, setModalTab] = useState(['C12', 'x18'].includes(screen) ? 'Effect' : ['C13', 'x19'].includes(screen) ? 'Configure' : ['C14', 'x20'].includes(screen) ? 'Speakers' : 'Style');
  const [setup, setSetup] = useState(screen === 'C01'); const [busy, setBusy] = useState(''); const [language, setLanguage] = useState('English');
  const [showTracks, setShowTracks] = useState(true);
  const [viewAll, setViewAll] = useState(false);
  useEffect(() => { document.body.classList.toggle('caption-tracks-hidden', !showTracks); return () => document.body.classList.remove('caption-tracks-hidden'); }, [showTracks]);
  const [styleName, setStyleName] = useState('My caption style'); const [expanded, setExpanded] = useState<string | null>(null);
  const [customStyles, setCustomStyles] = useState<SavedStyle[]>(loadSavedStyles);
  // cap-d1 (Quan, 30 Oct): setup before generating, line rows, presets of style editable in a popup (design-drafts/261030-captions-tab).
  const d1 = hasVariant('cap-d1'); const job = useCaptionJob(); const [presetEdit, setPresetEdit] = useState(false); const [remembered] = useState(() => d1 && !state.captions.generated && !!readDefaults());
  const settings = state.captions.settings;
  const update = (next: CaptionDocument, label: string) => actions.commit({ captions: writeCaption(state.captions, next) }, label);
  useEffect(() => {
    if(seeded.current)return;seeded.current=true;
    // Convert evidence seeds once. Subsequent edits, including toggles, remain undoable store data.
    const initial = readCaption(state.captions);
    const rem = d1 && !state.captions.generated ? readDefaults() : null;
    if (d1 && !state.captions.generated) {
      // First time: Full phrases + Auto emoji on (production). Returning: the last clip's settings.
      initial.style = { ...initial.style, ...(rem?.style ? presetOnly(rem.style) : {}), singleWord: rem?.format === 'words' };
      setLanguage(String(initial.style.language || 'English'));
    }
    actions.patch({ captions: { ...writeCaption(state.captions, { ...initial, speakers: screen === 'x20' ? initial.speakers.map((speaker, index) => ({ ...speaker, color: ['var(--text-1)', 'var(--art-b3ff42)', 'var(--art-ffff81)', 'var(--art-b5f7ff)', 'var(--art-ff8f4b)'][index] || speaker.color })) : initial.speakers, style: { ...initial.style, ...(['C07', 'C08'].includes(screen) ? { avatarPosition: 'Top' } : {}), ...(screen === 'x19' ? { highlight: 'None', breakLines: false, animationTarget: 'Sentence animations' } : {}), ...(['C11', 'C12', 'C13', 'x16'].includes(screen) ? { presetFlavor: 'hook' } : {}), ...(['x17', 'x18', 'x19', 'x20'].includes(screen) ? { presetFlavor: 'blue' } : {}) } }), preset: screen === 'x16' ? 'THE HOOK.' : rem?.preset || state.captions.preset, settings: { 'Multiple speakers': true, ...settings, ...(d1 && !state.captions.generated ? { Emojis: rem ? rem.emoji : true } : {}), ...(screen === 'x20' ? { 'Speaker avatars': false } : {}) } } });
    return () => timers.current.forEach(clearTimeout);
  }, []);
  useEffect(() => { const page = state.subPages[state.subPages.length - 1]; if (page?.type === 'edit') { setModal(true); setTab('Presets'); setModalTab(page.category === 'Speakers' ? 'Speakers' : 'Style'); } }, [state.subPages]);
  function setEffect(name: string, value: boolean) {
    if(name==='Multiple speakers'&&value&&!premium.require('captions-multiple-speakers'))return;
    const apply = () => {
      const current = latest.current.state; const next = { ...current.captions.settings, [name]: value };
      if (name === 'Emojis' && value) next['Speaker avatars'] = false;
      if (name === 'Speaker avatars' && value) next.Emojis = false;
      actions.commit({ captions: { ...current.captions, settings: next } }, `Toggle caption ${name}`); setBusy('');
    };
    if (value && ['AI Shake', 'AI Supersize', 'Emojis', 'Speaker avatars'].includes(name)) { if (busy) return; setBusy(name); timers.current.push(setTimeout(apply, 800)); } else apply();
  }
  function pickPreset(item: Preset) {
    actions.commit({ captions: writeCaption({ ...state.captions, preset: item.text }, { ...doc, style: { ...presetStyle(item.text, item.flavor), presetFlavor: item.flavor || 'comic' } }) }, 'Select caption preset');
  }
  // cap-d1 handlers: format and emoji apply at once (no busy delay) and are remembered for the next clips.
  const setWords = (words: boolean) => { update({ ...doc, style: { ...doc.style, singleWord: words } }, words ? 'Show captions word by word' : 'Show captions as full phrases'); rememberDefaults({ format: words ? 'words' : 'phrases' }); };
  const setEmoji = (on: boolean) => { actions.commit({ captions: { ...state.captions, settings: { ...settings, Emojis: on, ...(on ? { 'Speaker avatars': false } : {}) } } }, 'Toggle caption Emojis'); rememberDefaults({ emoji: on }); };
  const pickD1 = (item: Preset) => { const style = withPreset(doc, item); actions.commit({ captions: writeCaption({ ...state.captions, preset: item.text }, { ...doc, style }) }, 'Select preset of style'); rememberDefaults({ preset: item.text, style: presetOnly(style) }); };
  const pickSavedD1 = (item: D1Saved) => { const style = withSaved(doc, item); actions.commit({ captions: writeCaption({ ...state.captions, preset: item.name }, { ...doc, style }) }, 'Select preset of style'); rememberDefaults({ preset: item.name, style: presetOnly(style) }); };
  const savedD1 = customStyles.find(item => item.name === state.captions.preset);
  function applyD1(style: CaptionStyle) { update({ ...doc, style }, 'Edit preset of style'); rememberDefaults({ style: presetOnly(style) }); setPresetEdit(false); actions.notify('Applied to this clip'); }
  function saveD1(style: CaptionStyle) {
    const name = savedD1 ? savedD1.name : `My preset of style ${customStyles.length + 1}`;
    const next = savedD1 ? customStyles.map(item => item === savedD1 ? { name, style: presetOnly(style) } : item) : [{ name, style: presetOnly(style) }, ...customStyles];
    setCustomStyles(next); const stored = storeSavedStyles(next);
    actions.commit({ captions: writeCaption({ ...state.captions, preset: name }, { ...doc, style }) }, 'Save preset of style');
    rememberDefaults({ preset: name, style: presetOnly(style) }); setPresetEdit(false);
    actions.notify(stored ? `Saved to My presets of style: ${name}` : 'Saved for this session; browser storage is unavailable');
  }
  function openEditor() { setModalTab('Style'); setModal(true); actions.pushPage({ type: 'edit', title: 'Edit caption style' }); }
  function closeEditor() { setModal(false); if (state.subPages.length) actions.popPage(); }
  function generate() {
    if (d1) { startCaptionJob(language); return; } // W3: background job, finished by CaptionJobBridge on any tab
    setBusy('captions'); timers.current.push(setTimeout(() => {
      const current = latest.current; actions.commit({ captions: { ...writeCaption(current.state.captions, { ...current.doc, words: initialWords(), style: { ...current.doc.style, language } }), generated: true }, detachedCaptionSegments: [] }, 'Generate captions'); setBusy(''); setSetup(false);
    }, 1200));
  }
  function save() {
    // No name field in the reference modal: saved styles are numbered.
    const name = `Custom style ${customStyles.length + 1}`; const next = [...customStyles.filter(item => item.name !== name), { name, style: doc.style }];
    setCustomStyles(next); try { localStorage.setItem('eklipse-caption-styles', JSON.stringify(next)); } catch { actions.notify('Style saved for this session; browser storage is unavailable'); }
    closeEditor(); actions.notify(`Saved caption style: ${name}`);
  }
  return <div className="captions-root" data-screen={screen} data-tab={tab}>
    <PanelHeader title="Captions" />{d1 && job.phase === 'run' ? <CaptionMagic /> : d1 && job.phase === 'fail' ? <CaptionJobFailed retry={() => startCaptionJob(language)} back={cancelCaptionJob} /> : d1 && !state.captions.generated ? <CaptionSetup doc={doc} preset={state.captions.preset} saved={customStyles} language={language} setLanguage={setLanguage} setWords={setWords} emoji={!!settings.Emojis} setEmoji={setEmoji} pickPreset={pickD1} pickSaved={pickSavedD1} editPreset={() => setPresetEdit(true)} generate={generate} busy={busy === 'captions'} remembered={remembered} /> : <>{!d1&&hasVariant('look-save')&&state.captions.generated&&<LookSaveAction state={state}/>}{/* cap-d1: no "Save as my look", "Show all tracks" or "View all captions" (Quan, 30 Oct) */}{!d1 && <div className="captions-track-actions"><label><input type="checkbox" aria-label="Show all tracks" checked={showTracks} onChange={event => setShowTracks(event.target.checked)} />Show all tracks <span className="caption-track-state">{showTracks ? 'Visible' : 'Hidden'}</span></label><button onClick={() => { setTab('Text'); setSetup(false); setViewAll(true); }}>View all captions</button></div>}<div className="captions-main-tabs" role="tablist">{['Text', 'Effects', 'Presets'].map((item, i) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => { if (tab === item && !setup) actions.notify(`${item} captions are already open`); setTab(item); setSetup(false); }}>{['T ', '✧ ', '▦ '][i]}{item}</button>)}<button className="captions-palette" title="Caption style and language" aria-label="Caption style and language" onClick={() => d1 ? setTab('Effects') : setSetup(!setup)}><Icon name="globe" size={17} /></button></div>
    {hasVariant('cap-highlight-color') && !setup && state.captions.generated && <HighlightColorRow doc={doc} update={update} />}
    {!d1 && setup && <div className="captions-setup"><h2>Generate captions</h2><label>Language<select value={language} onChange={event => setLanguage(event.target.value)}>{['English', 'Spanish', 'French', 'German', 'Auto-detect'].map(name => <option key={name}>{name}</option>)}</select></label><h3>Choose a caption style</h3><div className="captions-setup-choices">{presetGroups[0].items.slice(0, 3).map(item => <button key={item.text} className={state.captions.preset === item.text ? 'active' : ''} onClick={() => pickPreset(item)}>{item.text}</button>)}</div><MockBadge note="Generates the local English demo transcript; the real editor transcribes the chosen language." /><button className="captions-primary" disabled={!!busy} onClick={generate}>{busy === 'captions' ? 'Generating…' : 'Generate captions'}</button></div>}
    {d1 && tab === 'Text' && <CaptionLines doc={doc} update={update} regenerate={generate} />}
    {d1 && tab === 'Effects' && <div className="captions-effects"><div className="cap-d1-label cap-d1-effects-head">Show captions as</div><FormatCards words={!!doc.style.singleWord} set={setWords} />
      <div className="cap-d1-label">Effects</div><EmojiCard on={!!settings.Emojis} set={setEmoji} />
      <button className="cap-d1-option" aria-pressed={!!settings['Hide Punctuation']} onClick={() => setEffect('Hide Punctuation', !settings['Hide Punctuation'])}><span className="captions-effect-icon">”</span><span className="captions-effect-copy"><b>Hide Punctuation</b><small>Remove ‘,.?!’ from captions</small></span><CaptionSwitch checked={!!settings['Hide Punctuation']} /></button>
      <div className="cap-d1-label">Caption language</div><select className="cap-d1-select" aria-label="Caption language" value={language} onChange={event => setLanguage(event.target.value)}>{captionLanguages.map(name => <option key={name}>{name}</option>)}</select>
      {language !== String(doc.style.language || 'English') && <p className="cap-d1-lang-note">Captions are in {String(doc.style.language || 'English')}. <button disabled={!!busy} onClick={generate}>{busy === 'captions' ? 'Generating…' : `Regenerate in ${language}`}</button></p>}
    </div>}
    {d1 && tab === 'Presets' && <div className="captions-presets">
      <div className="cap-d1-inuse"><span>In use</span><b>{state.captions.preset}</b><button className="captions-edit-chip" onClick={() => setPresetEdit(true)}>Edit</button></div>
      {customStyles.length > 0 && <section className="captions-preset-section cap-d1-section-mine"><div className="captions-section-head"><h2>My presets of style</h2></div><div className="captions-preset-grid">{customStyles.map(item => <PresetTile key={item.name} saved={item} selected={item === savedD1} onPick={() => pickSavedD1(item)} onEdit={() => setPresetEdit(true)} />)}</div></section>}
      {(expanded ? presetGroups.filter(group => group.name === expanded) : presetGroups).map(group => <section className="captions-preset-section" key={group.name}><div className="captions-section-head"><h2>{group.name}</h2>{group.viewAll && <button onClick={() => setExpanded(expanded ? null : group.name)}>{expanded ? 'Back to all presets of style' : 'View all'}</button>}</div><div className="captions-preset-grid">{group.items.map((item, index) =>
        <PresetTile key={index} item={item} selected={!savedD1 && state.captions.preset === item.text && String(doc.style.presetFlavor || 'comic') === (item.flavor || 'comic')} onPick={() => pickD1(item)} onEdit={() => setPresetEdit(true)} />)}</div></section>)}
    </div>}
    {!d1 && !setup && tab === 'Text' && (state.captions.generated ? <TranscriptEditor doc={doc} update={update} regenerate={() => setSetup(true)} /> : <div className="captions-setup"><p>No captions yet.</p><button className="captions-primary" onClick={() => setSetup(true)}>Generate captions</button></div>)}
    {!d1 && !setup && tab === 'Effects' && <div className="captions-effects">{busy && <p role="status">Preparing {busy}…</p>}{effectNames.map((name, index) => {
      const other = name === 'Emojis' ? 'Speaker avatars' : 'Emojis', blocked = ['Emojis', 'Speaker avatars'].includes(name) && settings[other];
      return <div className={`captions-effect-card ${blocked ? 'disabled' : ''}`} key={name}>{name==='Caption size'?<label className="captions-size-control"><span>Caption size</span><small>Adjust how large your captions appear</small><input aria-label="Caption size" type="range" min="24" max="80" value={Number(doc.style.size||48)} onChange={event=>update({...doc,style:{...doc.style,size:+event.target.value}},'Change caption size')}/><output>{Number(doc.style.size||48)}%</output></label>:<><button className="captions-effect-main" aria-pressed={!!settings[name]} onClick={() => blocked ? actions.notify(`Turn off ${other} first`) : setEffect(name, !settings[name])}><span className="captions-effect-icon">{effectIcons[index]}</span><span className="captions-effect-copy"><b>{name}</b><small>{blocked ? `Can't be used with ${other}` : effectDescriptions[index]}</small></span><CaptionSwitch checked={!!settings[name]} /></button>
        {name === 'Multiple speakers' && settings[name] && <button className="captions-speaker-strip" onClick={() => { setModal(true); setModalTab('Speakers'); }}><span>🌈👩🏻‍🎤🧑🏽‍🎤👩🏾‍🎤🧑🏼‍🎤</span><small>{doc.speakers.length} speakers</small><b>›</b></button>}
        {['Emojis', 'Speaker avatars'].includes(name) && settings[name] && <Segmented items={['Top', 'Bottom', 'Left', 'Right']} value={String(doc.style.avatarPosition || 'Bottom')} set={value => update({ ...doc, style: { ...doc.style, avatarPosition: value } }, 'Position caption decoration')} />}
      </>}</div>;
    })}</div>}
    {!d1 && !setup && tab === 'Presets' && <div className="captions-presets">{/* Thinh 29 Oct: pick a preset only, no style studio or custom styles (as in production) */}
      {(expanded ? presetGroups.filter(group => group.name === expanded) : presetGroups).map(group => <section className="captions-preset-section" key={group.name}><div className="captions-section-head"><h2>{group.name}</h2>{group.viewAll && <button onClick={() => setExpanded(expanded ? null : group.name)}>{expanded ? 'Back to all styles' : 'View all'}</button>}</div><div className="captions-preset-grid">{group.items.map((item, index) => {
        const selected = state.captions.preset === item.text && (!doc.style.presetFlavor || doc.style.presetFlavor === (item.flavor || 'comic'));
        return <button key={index} className={`captions-preset-tile ${selected ? 'selected' : ''}`} onClick={() => { if (!selected) pickPreset(item); }}>{item.globe && <span className="captions-globe">🌐</span>}{selected && <span className="captions-check"><Icon name="check" size={13} /></span>}<span className={`captions-preset-sample ${item.flavor || ''}`}>{item.text}</span>{selected && <span className="captions-edit-chip">Edit</span>}</button>;
      })}</div></section>)}
    </div>}
    {viewAll && <div className="captions-all-shade" onClick={() => setViewAll(false)}><section role="dialog" aria-label="All captions" onClick={event => event.stopPropagation()}><header><h2>All captions</h2><button title="Close all captions" onClick={() => setViewAll(false)}>×</button></header><div>{doc.words.map((word, index) => <button key={index} onClick={() => { actions.patch({ playhead: word.startMs / 1000, captionTrackSelected: true }); setViewAll(false); }}>{(word.startMs / 1000).toFixed(1)}s · {word.text}</button>)}</div></section></div>}
    </>}
    {d1 && presetEdit && <PresetEditor doc={doc} name={state.captions.preset} mine={!!savedD1} settings={settings} onApply={applyD1} onSave={saveD1} onClose={() => setPresetEdit(false)} />}
    {modal && !d1 && <StyleEditor tab={modalTab} setTab={setModalTab} onClose={closeEditor} onSave={save} browse={() => { closeEditor(); setTab('Presets'); }} doc={doc} update={update} settings={settings} setEffect={setEffect} busy={busy} name={styleName} setName={setStyleName} />}
  </div>;
}
