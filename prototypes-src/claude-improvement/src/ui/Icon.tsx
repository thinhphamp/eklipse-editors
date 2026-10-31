import { iconMap, type IconName } from './icon-map';
export type { IconName } from './icon-map';
// Relative href: the build uses base './' so the sprite resolves next to prototype.html.
export function Icon({name,size=20}:{name:IconName;size?:number}) {
  return <svg className="ui-icon" aria-hidden="true" width={size} height={size}><use href={'icons/sprite.svg#'+iconMap[name]}/></svg>;
}
