import { useEffect, useMemo, useState } from 'react';
import { useEditor, type TrackItem } from '../../../state';
import type { MediaItem } from '../../../fixtures';
import { shaderPresets } from '../../../data';
import { Icon } from '../../../ui/Icon';
import { usePremium } from '../../../ui/premium';
import './el-tabs.css';

// el-tabs (Quan, 30 Oct): Elements organised like production (Meme · Texts · Effects, Audio stays on the rail), plus an
// All tab with one row per type, one search across every tab with result counts, and "On this clip" listing what is
// already added (AI Edit items tagged). design-drafts/261030-elements-menu, variant B.

type TabId = 'All'|'Meme'|'Texts'|'Effects';
type Group = 'Memes'|'GIFs'|'Stickers'|'Emotes'|'Uploads'|'Titles'|'Intro'|'Outro'|'Reactions'|'Effects';
type El = { key: string; name: string; group: Group; asset?: MediaItem; color?: string; text?: string; add: () => void };
export type AddFn = (cat: any, label: string, animated?: boolean, asset?: MediaItem, extra?: Record<string, string>) => void;

const SUBS: Record<Exclude<TabId,'All'>, Group[]> = { Meme: ['Memes','GIFs','Stickers','Emotes','Uploads'], Texts: ['Titles','Intro','Outro','Reactions'], Effects: ['Effects'] };
const tabOf = (g: Group): Exclude<TabId,'All'> => (SUBS.Meme.includes(g) ? 'Meme' : SUBS.Texts.includes(g) ? 'Texts' : 'Effects');
const SHELVES: Group[] = ['Memes','Titles','GIFs','Stickers','Emotes','Effects'];
const shelfName = (g: Group) => (g === 'Titles' ? 'Texts' : g);
const textArt = ['var(--art-a8ff00)','var(--art-ffffff)','var(--art-f4f400)','var(--art-47fa4b)','var(--art-d0b7ff)','var(--art-ff403b)','var(--art-ffda00)','var(--art-13f3d0)','var(--art-e877e9)'];
const reactions = ['Nice shot!','reacted','liked','cheered'];
const RECENT_KEY = 'ek-el-recent', TAB_KEY = 'ek-el-tab';
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || '') as T; } catch { return d; } };
const mmss = (s: number) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

function Thumb({el}: {el: El}) {
  const p = el.asset?.path || '';
  if (p.endsWith('.webm')) return <video src={p + '#t=1'} muted loop playsInline preload="metadata"/>;
  if (p.endsWith('.json')) return <span className="elt-glyph"><Icon name="elements" size={26}/></span>;
  if (p) return <img src={p} alt="" className={el.group === 'Emotes' ? 'fit' : ''}/>;
  if (el.group === 'Reactions') return <span className="elt-react"><b>streamer</b>{el.text}</span>;
  if (el.group === 'Effects') return <span className="elt-fx">{el.name}</span>;
  return <span className="elt-text" style={{color: el.color}}>{el.text}</span>;
}

function Tile({el}: {el: El}) {
  const ms = el.asset?.durationMs;
  return <button className="elt-tile" title={el.name} onClick={el.add}
    onMouseEnter={e => void e.currentTarget.querySelector('video')?.play().catch(() => {})}
    onMouseLeave={e => e.currentTarget.querySelector('video')?.pause()}>
    <span className="elt-th"><Thumb el={el}/>{ms ? <span className="elt-len">{mmss(ms / 1000)}</span> : null}<span className="elt-add"><Icon name="plus" size={11}/> Add</span></span>
    <span className="elt-nm">{el.name}</span>
  </button>;
}

export function ElTabs({media, add, edit, hook}: {media: MediaItem[]; add: AddFn; edit: (item: TrackItem) => void; hook: () => void}) {
  const {state, actions} = useEditor(), premium = usePremium();
  const [tab, setTab] = useState<TabId>(() => read<TabId>(TAB_KEY, 'All'));
  const [sub, setSub] = useState<Group>('Memes');
  const [q, setQ] = useState(''), [cols, setCols] = useState(3), [moreOnClip, setMoreOnClip] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => read<string[]>(RECENT_KEY, []));
  const [uploads, setUploads] = useState<MediaItem[]>([]);
  useEffect(() => { localStorage.setItem(TAB_KEY, JSON.stringify(tab)); }, [tab]);

  const all = useMemo(() => {
    const remember = (key: string) => setRecent(r => { const next = [key, ...r.filter(x => x !== key)].slice(0, 8); localStorage.setItem(RECENT_KEY, JSON.stringify(next)); return next; });
    const seen = new Set<string>(), list: El[] = [];
    const push = (el: Omit<El,'add'>, run: () => void) => list.push({...el, add: () => { run(); remember(el.key); }});
    const assets = (kind: string[], group: Group, cat: string) => media.filter(m => kind.includes(m.kind) && !(m.kind === 'meme' && !m.path.endsWith('.webm'))).forEach(m => {
      const key = group + ':' + m.title; if (seen.has(key)) return; seen.add(key);
      push({key, name: m.title, group, asset: m}, () => add(cat, m.title, false, m));
    });
    assets(['meme'], 'Memes', 'Memes'); assets(['gif'], 'GIFs', 'Gifs'); assets(['sticker-lottie','sticker-webm'], 'Stickers', 'Animated Stickers'); assets(['emote'], 'Emotes', 'Twitch Emotes');
    uploads.forEach(m => push({key: 'Uploads:' + m.title, name: m.title, group: 'Uploads', asset: m}, () => add('Custom Elements', m.title, false, m)));
    (['Titles','Intro','Outro'] as Group[]).forEach(g => textArt.forEach((color, i) => {
      const text = g === 'Titles' ? 'Enter text here' : g === 'Intro' ? 'Wait for it' : 'Follow for more';
      push({key: g + ':' + i, name: g === 'Titles' ? 'Title ' + (i + 1) : g + ' ' + (i + 1), group: g, color, text}, () => add('Text Elements', text, false, undefined, {fill: color}));
    }));
    reactions.forEach((r, i) => push({key: 'Reactions:' + i, name: 'Reaction ' + (i + 1), group: 'Reactions', text: r}, () => add('Reactions', r === 'Nice shot!' ? r : 'streamer ' + r)));
    shaderPresets.forEach(p => push({key: 'Effects:' + p.name, name: p.name, group: 'Effects'}, () => {
      if (!premium.require('shader-effects')) return;
      actions.addItem({label: p.name, kind: 'effect', category: 'Effects', start: Math.max(0, state.playhead), duration: p.durationMs / 1000, shader: p.name});
      actions.notify(p.name + ' added. Fine-tune it in the Effects tab.');
    }));
    return list;
  }, [media, uploads, add, actions, premium, state.playhead]);

  const term = q.trim().toLowerCase();
  const found = term ? all.filter(e => (e.name + ' ' + e.group + ' ' + (e.text || '')).toLowerCase().includes(term)) : all;
  const inGroup = (g: Group) => found.filter(e => e.group === g);
  const count = (t: Exclude<TabId,'All'>) => found.filter(e => tabOf(e.group) === t).length;
  const subs = tab === 'All' ? [] : SUBS[tab];
  const activeSub = subs.includes(sub) ? sub : subs[0];
  const open = (t: TabId, g?: Group) => { setTab(t); if (g) setSub(g); };

  const onClip = state.elements.filter(x => x.kind === 'element' && x.category !== 'Social Stickers');
  const shownOnClip = moreOnClip ? onClip : onClip.slice(0, 6);
  const recentEls = recent.map(k => all.find(e => e.key === k)).filter(Boolean) as El[];

  const grid = (els: El[], c = cols) => <div className="elt-grid" style={{['--cols' as string]: c}}>{els.map(e => <Tile key={e.key} el={e}/>)}</div>;
  const shelf = (els: El[]) => <div className="elt-shelf">{els.map(e => <Tile key={e.key} el={e}/>)}</div>;
  const head = (title: string, n?: number, see?: () => void) => <div className="elt-sec"><h2>{title}{n !== undefined && <small>{n}</small>}</h2>{see && <button onClick={see}>See all</button>}</div>;
  const upload = <label className="elements-upload"><input type="file" accept="image/png,image/jpeg,image/gif" onClick={e => { if (!premium.require('upload-custom-elements')) e.preventDefault(); }} onChange={e => {
    const f = e.target.files?.[0]; if (!f) return; if (f.size > 10 * 1024 * 1024) { actions.notify('Files must be 10 MB or smaller'); return; }
    const path = URL.createObjectURL(f); setUploads(u => [{path, kind: 'image', category: 'Uploads', title: f.name, bytes: f.size, source: 'upload', licence: '', note: ''} as MediaItem, ...u]); e.target.value = '';
  }}/><strong><Icon name="upload" size={22}/></strong><span>Upload a file</span><small>Max 10 MB files are allowed<br/>Supported formats: .png, .jpeg, .gif</small></label>;
  const hookCard = <button className="elt-hook" onClick={hook}><b>AI</b><span><strong>AI - Hook intro title</strong><small>Add an intro hook title to the start of your clip</small></span></button>;

  let body: React.ReactNode;
  if (tab === 'All' && term) {
    const groups = (['Memes','GIFs','Stickers','Emotes','Uploads','Titles','Intro','Outro','Reactions','Effects'] as Group[]).filter(g => inGroup(g).length);
    body = groups.length ? groups.map(g => <div key={g}>{head(g, inGroup(g).length, () => open(tabOf(g), g))}{grid(inGroup(g).slice(0, 6), 3)}</div>)
      : <div className="elt-empty"><b>Nothing matches “{q.trim()}”</b><span>Try</span><div>{['cat','gg','pog'].map(s => <button key={s} onClick={() => setQ(s)}>{s}</button>)}</div><span>or upload your own in Meme › Uploads.</span></div>;
  } else if (tab === 'All') {
    body = <>{recentEls.length > 0 && <>{head('Recently used')}{shelf(recentEls)}</>}
      {SHELVES.map(g => <div key={g}>{head(shelfName(g), undefined, () => open(tabOf(g), g))}{shelf(inGroup(g).slice(0, 8))}</div>)}</>;
  } else {
    const items = inGroup(activeSub), others = (['Meme','Texts','Effects'] as const).filter(t => t !== tab && count(t));
    body = <>{subs.length > 1 && <div className="elt-pills">{subs.map(g => <button key={g} className={g === activeSub ? 'active' : ''} onClick={() => setSub(g)}>{g}</button>)}<button className="elt-cols" title={cols === 3 ? 'Larger tiles' : 'Smaller tiles'} aria-label="Grid size" onClick={() => setCols(c => (c === 3 ? 2 : 3))}><Icon name={cols === 3 ? 'zoom-in' : 'zoom-out'} size={15}/></button></div>}
      {activeSub === 'Titles' && !term && hookCard}
      {activeSub === 'Uploads' && upload}
      {items.length ? grid(items) : activeSub === 'Uploads' ? null
        : <div className="elt-empty"><b>No {activeSub === 'Effects' ? 'effects' : activeSub.toLowerCase()} match “{q.trim()}”</b>{others.length ? <div>{others.map(t => <button key={t} onClick={() => setTab(t)}>{count(t)} in {t}</button>)}</div> : <div><button onClick={() => setQ('')}>Clear search</button></div>}</div>}</>;
  }

  return <div className="elt">
    <div className="elt-sticky">
      <label className="elt-search"><Icon name="search" size={16}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search memes, GIFs, texts, emotes…"/>{q && <button aria-label="Clear search" onClick={() => setQ('')}><Icon name="close" size={14}/></button>}</label>
      <div className="elt-tabs" role="tablist">{(['All','Meme','Texts','Effects'] as TabId[]).map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}{term && t !== 'All' && <span>{count(t)}</span>}</button>)}</div>
    </div>
    {onClip.length > 0 && !term && <div className="elt-onclip">
      <div className="elt-onclip-h">On this clip <small>{onClip.length} element{onClip.length > 1 ? 's' : ''}</small></div>
      <div className="elt-chips">{shownOnClip.map(item => <span key={item.id} className={'elt-chip' + (item.id === state.selectedElementId ? ' active' : '')}>
        <button className="elt-chip-main" onClick={() => edit(item)} title={'Edit ' + item.label}>
          <span className="elt-mini">{item.media?.endsWith('.webm') ? <video src={item.media + '#t=1'} muted preload="metadata"/> : item.media && !item.media.endsWith('.json') ? <img src={item.media} alt=""/> : <b>{item.category === 'Text Elements' ? 'Aa' : item.label.slice(0, 2)}</b>}</span>
          <span className="elt-chip-name">{item.label}</span><small>{mmss(item.start)}</small>{item.ai && <em>AI</em>}
        </button>
        <button className="elt-chip-x" aria-label={'Remove ' + item.label} onClick={() => { actions.removeItem(item.id); actions.notify('Removed ' + item.label); }}><Icon name="close" size={12}/></button>
      </span>)}
      {onClip.length > 6 && <button className="elt-more" onClick={() => setMoreOnClip(x => !x)}>{moreOnClip ? 'Show less' : '+' + (onClip.length - 6) + ' more'}</button>}</div>
      {onClip.some(x => x.ai) && <p className="elt-aihint">AI Edit added the tagged ones. Click one to swap or move it.</p>}
    </div>}
    {body}
  </div>;
}
