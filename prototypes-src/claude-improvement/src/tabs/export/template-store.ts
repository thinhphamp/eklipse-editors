import type { EditorState } from '../../state';
export type SavedTemplate={name:string;layout:string;fields:Record<string,boolean>;project:Partial<EditorState>};
const key='ek-proto-templates';
export function loadTemplates():SavedTemplate[]{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter((t):t is SavedTemplate=>t&&typeof t.name==='string'&&t.fields&&typeof t.fields==='object'&&t.project&&typeof t.project==='object'):[]}catch{return []}}
/** Replaces the whole saved list (Templates panel: rename, delete, undo delete). */
export function writeTemplates(list:SavedTemplate[]){localStorage.setItem(key,JSON.stringify(list));window.dispatchEvent(new Event('storage'))}
export function saveTemplate(state:EditorState){const project:Partial<EditorState>={layoutId:state.layoutId,cropOverrides:state.cropOverrides,elements:state.elements,effects:state.effects,audio:state.audio,captions:state.captions};const list=loadTemplates();list.push({name:state.templateName,layout:state.layoutId,fields:state.templateFields,project});localStorage.setItem(key,JSON.stringify(list));window.dispatchEvent(new Event('storage'))}
export function applyTemplate(template:SavedTemplate,state:EditorState):Partial<EditorState>{
 const fields=template.fields,p=template.project,result:Partial<EditorState>={};
 const fresh=(list:EditorState['elements'])=>list.map(item=>({...item,id:'item-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)}));
 const included=(category:string)=>fields.Text&&category==='Text Elements'||fields.Gifs&&category==='Gifs'||fields.Stickers&&['Animated Stickers','Social Stickers','Twitch Emotes','Reactions','Custom Elements'].includes(category);
 if(fields.Layout){result.layoutId=p.layoutId||state.layoutId;result.cropOverrides=p.cropOverrides||{}}
 if(fields.Text||fields.Gifs||fields.Stickers)result.elements=[...state.elements.filter(x=>!included(x.category)),...fresh((p.elements||[]).filter(x=>included(x.category)))];
 if(fields.Captions&&p.captions)result.captions=p.captions;
 if(fields['Sound Effects']&&p.audio)result.audio=fresh(p.audio);
 if((fields['Video Effects']||fields['AI Word Censoring'])&&p.effects)result.effects=fresh(p.effects);
 return result;
}
