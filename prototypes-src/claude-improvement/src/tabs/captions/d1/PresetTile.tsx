import { Icon } from '../../../ui/Icon';
import { captionStyle } from '../render-style';
import type { CaptionStyle } from '../model';
import type { Preset } from '../catalog';

/** One preset of style. Built-in tiles use the catalog sample classes; saved ones draw their own style. */
export function PresetTile({ item, saved, selected, onPick, onEdit, compact }: { item?: Preset; saved?: { name: string; style: CaptionStyle }; selected: boolean; onPick: () => void; onEdit: () => void; compact?: boolean }) {
  const look = saved ? { ...captionStyle(saved.style), fontSize: compact ? 13 : 16, WebkitTextStroke: '1px var(--art-151515)', whiteSpace: 'normal' as const } : undefined;
  return <div className={`captions-preset-tile cap-d1-tile ${selected ? 'selected' : ''} ${compact ? 'compact' : ''}`}>
    <button className="cap-d1-tile-pick" aria-pressed={selected} aria-label={`Preset of style ${saved?.name || item?.text}`} onClick={onPick}>
      {item?.globe && <span className="captions-globe">🌐</span>}
      {selected && <span className="captions-check"><Icon name="check" size={13} /></span>}
      {saved ? <span className="cap-d1-saved-sample" style={look}>{saved.name}</span> : <span className={`captions-preset-sample ${item?.flavor || ''}`}>{item?.text}</span>}
      {saved && <small className="cap-d1-mine">My preset of style</small>}
    </button>
    {selected && <button className="captions-edit-chip" onClick={onEdit}>Edit</button>}
  </div>;
}
