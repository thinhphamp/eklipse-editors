import { useEditor } from '../state';
export function Toast() {const {state,actions}=useEditor();return <>{state.toast?<div className="toast" role="status"><span>{state.toast}</span><button onClick={()=>actions.patch({toast:''})}>×</button></div>:null}<span className="toast-state" aria-hidden="true" style={{display:'none'}}>{state.toast?'notice':'clear'}</span></>;}
