import { useEditor } from '../../state';
import { usePlaybackTime } from '../../engine/use-playback';
import { ChannelStickerView } from './looks';
import { isChannelSticker, slotY, useGhost } from './channel-set';
import './channel-stickers.css';

/** ch-stickers: the look hovered in the panel, drawn where "+ Add" will place it. */
export function ChannelGhost() {
  const { state } = useEditor(), time = usePlaybackTime(), ghost = useGhost();
  if (!ghost || state.activeTab !== 'Socials') return null;
  const visible = state.elements.filter(x => isChannelSticker(x) && time >= x.start && time < x.start + x.duration).length;
  return <div className="cs-ghost" style={{ left: '30%', top: `${slotY(visible)}%`, width: '41%', height: '7%' }}>
    <ChannelStickerView look={ghost.look} plats={ghost.plats} color={ghost.color} name={ghost.name} size="3cqw" />
  </div>;
}
