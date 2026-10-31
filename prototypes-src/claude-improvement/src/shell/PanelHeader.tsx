import { Icon } from '../ui/Icon';
import { useEditor } from '../state';
export function PanelHeader({title,subtitle,onBack}:{title:string;subtitle?:string;onBack?:()=>void}) {const {actions}=useEditor();return <header className="panel-header"><div>{onBack && <button className="panel-back" onClick={onBack}><Icon name="back" size={16}/> Back</button>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><button className="panel-collapse" title="Collapse panel" aria-label="Collapse panel" onClick={()=>actions.patch({panelCollapsed:true})}><Icon name="collapse" size={19}/></button></header>;}
