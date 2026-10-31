import { useState } from 'react';
import type { MediaItem } from '../../../fixtures';
import { MediaTile } from '../media';
import './variants.css';

// Variant el-jump: category chips scroll to a section; one search spans memes, GIFs and emotes.
const chips: [string, string][] = [['Text', 'Text Elements'], ['Memes & stickers', 'Animated Stickers'], ['GIFs', 'Gifs'], ['Emotes', 'Twitch Emotes'], ['Social', 'Social Stickers'], ['Upload', 'Custom Elements']];
const cats: Record<string, string> = { 'sticker-lottie': 'Animated Stickers', 'sticker-webm': 'Animated Stickers', gif: 'Gifs', emote: 'Twitch Emotes' };

export function ElJump({media, add}: {media: MediaItem[]; add: (cat: any, label: string, animated?: boolean, asset?: MediaItem) => void}) {
  const [q, setQ] = useState(''), term = q.trim().toLowerCase();
  const results = term ? media.filter(x => cats[x.kind] && x.title.toLowerCase().includes(term)) : [];
  function jump(title: string) {
    const h = [...document.querySelectorAll('.elements-root .panel-section h2')].find(x => x.textContent === title);
    const sec = h?.closest('section'), box = sec?.closest('.panel-scroll');
    if (sec && box) box.scrollTo({top: box.scrollTop + sec.getBoundingClientRect().top - box.getBoundingClientRect().top - 52, behavior: 'smooth'});
    if (title === 'Twitch Emotes') (document.querySelector('.elements-root input[placeholder="Search Twitch emotes"]') as HTMLInputElement | null)?.focus({preventScroll: true});
  }
  return <div className="el-jump">
    <div className="el-jump-chips">{chips.map(([label, title]) => <button key={label} onClick={() => jump(title)}>{label}</button>)}</div>
    <input className="el-jump-search" placeholder="Search memes, GIFs, emotes" value={q} onChange={e => setQ(e.target.value)}/>
    {term && (results.length ? <div className="elements-grid el-jump-results">{results.slice(0, 18).map(a => <MediaTile key={a.path} item={a} onClick={() => add(cats[a.kind], a.title, false, a)}/>)}</div> : <p className="elements-no-results">No results found</p>)}
  </div>;
}
