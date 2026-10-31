import { useEffect, useState } from 'react';
import { loadManifest, type MediaItem } from '../../fixtures';

export function useElementMedia() {
  const [items, setItems] = useState<MediaItem[]>([]);
  useEffect(() => { loadManifest().then(data => setItems(data.items)).catch(() => setItems([])); }, []);
  return items;
}

export function MediaTile({item, onClick}: {item: MediaItem; onClick: () => void}) {
  return <button className="elements-tile elements-media-tile" title={item.title} onClick={onClick}>
    {item.path.endsWith('.webm') ? <video src={item.path} muted loop autoPlay playsInline/> : item.path.endsWith('.json') ? <span>✨</span> : <img src={item.path} alt=""/>}
    <small>{item.title}</small>
  </button>;
}
