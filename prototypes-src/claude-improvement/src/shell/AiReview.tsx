import { useEditor, type TrackItem } from '../state';
import { Icon, type IconName } from '../ui/Icon';
import { useAddTitle } from './title-element';
import './ai-review.css';

// Claude improvement C9: after AI Edit, a strip lists what the AI placed (memes, zooms, sounds) with keep/remove per
// item and one suggested change. Web projects 5-22 Oct: AI memes left untouched export 44.4%, AI memes plus a user
// trim, title, caption or meme 72.9%; 89.1% of AI-meme projects also get zoom. Removals are undoable; the real
// editor would log each one (`ai_item_removed`), which the saved project files cannot show.
const kindOf = (x: TrackItem): { noun: string; icon: IconName } => x.kind === 'effect' ? { noun: 'zoom', icon: 'zoom' } : x.kind === 'audio' ? { noun: 'sound', icon: 'volume' } : { noun: 'meme', icon: 'elements' };
const time = (s: number) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const plural = (n: number, noun: string) => n + ' ' + noun + (n === 1 ? '' : 's');

export function AiReview() {
  const { state, actions } = useEditor();
  const addTitle = useAddTitle();
  const items = [...state.elements, ...state.effects, ...state.audio].filter(x => x.ai).sort((a, b) => a.start - b.start);
  if (state.aiReviewDone || !items.length) return null;
  const counts = ['meme', 'zoom', 'sound'].map(noun => [noun, items.filter(x => kindOf(x).noun === noun).length] as const).filter(([, n]) => n > 0);
  const summary = counts.map(([noun, n]) => plural(n, noun)).join(', ').replace(/, ([^,]*)$/, ' and $1');
  const open = state.aiReviewOpen;
  return <section className={'ai-review' + (open ? ' open' : '')} aria-label="AI edit review">
    <div className="ai-review-head">
      <span className="ai-spark" aria-hidden="true">✦</span>
      <p><strong>AI Edit added {summary}.</strong> <span>Clips you adjust after AI Edit get exported more often.</span></p>
      <button className="tb-secondary" onClick={() => actions.patch({ aiReviewOpen: !open })}>{open ? 'Hide list' : 'Review'}</button>
      <button className="tb-ghost" onClick={() => { actions.patch({ aiReviewDone: true, aiReviewOpen: false }); actions.notify('Kept everything AI Edit added'); }}>Keep all</button>
    </div>
    {open && <div className="ai-review-pop"><ul className="ai-review-list">{items.map(x => { const k = kindOf(x); return <li key={x.id}>
      <button className="ai-item-go" title="Jump to this moment" onClick={() => actions.patch({ playhead: x.start })}><Icon name={k.icon} size={15} /><span>{x.label}</span><small>{k.noun} · {time(x.start)}</small></button>
      <button className="ai-item-keep" onClick={() => actions.updateItem(x.id, { ai: false })}><Icon name="check" size={13} /> Keep</button>
      <button className="ai-item-remove" onClick={() => { actions.removeItem(x.id); actions.notify('Removed ' + x.label + '. Undo with ⌘Z'); }}><Icon name="trash" size={13} /> Remove</button>
    </li>; })}</ul>
      <div className="ai-review-next"><span>Make it yours with one change:</span>
        <button onClick={addTitle}><Icon name="type" size={14} /> Add a title</button>
        <button onClick={() => actions.chooseTab('Captions')}><Icon name="captions" size={14} /> {state.captions.generated ? 'Edit captions' : 'Add captions'}</button>
        <button onClick={() => actions.split()}><Icon name="scissors" size={14} /> Split at playhead</button>
      </div></div>}
  </section>;
}
