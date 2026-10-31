import { useEffect } from 'react';
const groups: [string, [string,string][]][] = [
 ['Editing',[['Undo','⌘ Z'],['Redo','⌘ ⇧ Z|⌘ Y'],['Delete','⌫|⌦'],['Duplicate','⌘ D'],['Trim Start','['],['Trim End',']'],['Split','S'],['Deselect','Escape']]],
 ['Layering',[['Bring To Foreground','⌘ ;'],['Send To Background',"⌘ '"],['Bring Forwards','⌘ ]'],['Send Backwards','⌘ [']]],
 ['Resizing',[['Resize From Center','⌥'],['Resize Maintain Aspect Ratio','⇧'],['Resize Maintain Aspect Ratio From Center','⇧ ⌥']]],
 ['Timeline',[['Go To Start','⌘ ←|Home'],['Go To End','⌘ →|End'],['Go To 0%–90%','0–9']]],
 ['Movement',[['Up','↑|W'],['Down','↓|S'],['Left','←|A'],['Right','→|D']]],
 ['Playback',[['Mute/Unmute','M'],['Play/Pause','K|Space'],['Toggle Fullscreen','F'],['Skip Backward','J|←'],['Skip Forward','L|→'],['Skip Backward 10','⇧ J|⇧ ←'],['Skip Forward 10','⇧ L|⇧ →']]],
 ['View',[['Zoom In','⌘ ='],['Zoom Out','⌘ -'],['Zoom Reset','⌘ 0']]],['Other',[['Show Keybindings','⌘ /']]],
];
export function ShortcutDialog({onClose}:{onClose:()=>void}) {useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[onClose]);return <div className="shortcut-shade" onPointerDown={e=>{if(e.target===e.currentTarget)onClose()}}><section role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" className="shortcut-dialog"><header><h2>Keyboard shortcuts</h2><button title="Close keyboard shortcuts" onClick={onClose}>×</button></header><div className="shortcut-groups">{groups.map(([name,rows])=><section key={name}><h3>{name}</h3>{rows.map(([action,keys])=><div className="shortcut-row" key={action}><span>{action}</span><span>{keys.split('|').map((key,i)=><span key={i}>{i>0&&<small>or</small>}<kbd>{key}</kbd></span>)}</span></div>)}</section>)}</div></section></div>}
