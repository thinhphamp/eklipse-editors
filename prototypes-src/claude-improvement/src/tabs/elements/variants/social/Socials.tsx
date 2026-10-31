import '../../Elements.css';
import { PanelHeader } from '../../../../shell/PanelHeader';
import { BrandGallery } from './BrandGallery';

// Variant soc-rail-tab: the "Socials" rail tab.
export function Socials() {
  return <div className="elements-panel elements-root"><PanelHeader title="Socials" subtitle="Your channel sticker, on every clip" /><BrandGallery /></div>;
}
