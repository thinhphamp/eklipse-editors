import type { EditorState, TrackItem } from './state';
import { layoutNames, templateFields } from './data';

type Seed = Partial<EditorState>;
const pos = (x:number,y:number,width:number,height:number) => ({x,y,width,height,opacity:100});
const element = (id:string,label:string,category:string,start:number,duration:number,preview:TrackItem['preview']):TrackItem =>
  ({id,label,category,kind:'element',start,duration,preview});
const baseElements:TrackItem[] = [
  element('project-social','thinhsocial','Social Stickers',10,5,pos(30,14,41,7)),
  element('project-text','ENTER TEXT HERE','Text Elements',23,5,pos(29,13,45,10)),
  element('project-reaction','Nice shot!','Reactions',36,5,pos(24,59,47,6)),
];
const baseEffects:TrackItem[] = [
  {id:'project-zoom',label:'Zoom',kind:'effect',category:'Zoom',start:43,duration:5},
  {id:'project-speed',label:'0.5×',kind:'effect',category:'Speed Control',start:37,duration:3},
  {id:'project-censor',label:'Censor',kind:'effect',category:'AI Word censoring',start:30,duration:4},
];
const baseAudio:TrackItem[] = [
  {id:'project-song',label:'Chill Gaming Beat',kind:'audio',category:'Music',start:0,duration:60,media:'media/music/chill-lofi.m4a',loop:true,volume:35,fadeOut:2},
  {id:'project-sound',label:'Doom Music',kind:'audio',category:'Gaming',start:23,duration:13,media:'media/sfx/gaming-headshot.mp3',volume:80},
];
const caption = (text='RELOADING.',settings:Record<string,boolean>={}) =>
  ({generated:true,preset:'Floating Words',text,settings});
const project:Seed = {layoutId:'Split',elements:baseElements,effects:baseEffects,audio:baseAudio,captions:caption(),duration:60,playhead:18};
const seeds:Record<string,Seed> = {default:{...project,activeTab:'Layouts',layoutId:'Split',playhead:0}};
const put = (id:string,seed:Seed) => {seeds[id]={...project,...seed}};
const sequence = (prefix:string,last:number) => Array.from({length:last+1},(_,n)=>prefix+String(n).padStart(2,'0'));

// Every captured screen enters its tab before React mounts. Detail panel state
// remains owned by the tab; this file owns the shared project and canvas state.
put('L00',{activeTab:'Layouts',layoutId:'Circle facecam',elements:[],effects:[],audio:[],captions:{...caption(),generated:false},playhead:0});
layoutNames.forEach((layout,i)=>put('L'+String(i+1).padStart(2,'0'),{activeTab:'Layouts',layoutId:layout,elements:[],effects:[],audio:[],captions:{...caption(),generated:false},playhead:0}));
put('L14',{...seeds.L04,snapping:false});
// C9: AI Edit output as users get it (memes + zoom + sounds placed by AI, nothing else touched yet).
const aiMeme=(id:string,label:string,file:string,start:number,p:TrackItem['preview']):TrackItem=>({...element(id,label,'Custom Elements',start,3,p),media:'media/memes/'+file,ai:true});
put('R01',{activeTab:'Layouts',layoutId:'Split',captions:{...caption(),generated:false},playhead:0,
  elements:[aiMeme('ai-meme-1','Whoa whoa whoa','whoa-whoa-whoa-no-no-we-re-not-doing-5818.webm',8,pos(22,52,56,22)),aiMeme('ai-meme-2','Big speaker','big-speaker-5817.webm',24,pos(30,55,40,22)),aiMeme('ai-meme-3','We are back','we-are-back-bitches-5820.webm',47,pos(25,50,50,24))],
  effects:[{id:'ai-zoom-1',label:'Zoom',kind:'effect',category:'Zoom',start:12,duration:3,zoom:1.5,ai:true},{id:'ai-zoom-2',label:'Zoom',kind:'effect',category:'Zoom',start:40,duration:3,zoom:1.4,ai:true}],
  audio:[{id:'ai-sfx-1',label:'Boom',kind:'audio',category:'Gaming',start:8,duration:2,media:'media/sfx/gaming-duar-boom.mp3',volume:80,ai:true},{id:'ai-sfx-2',label:'Blaster shot',kind:'audio',category:'Gaming',start:24,duration:2,media:'media/sfx/gaming-blaster-shot.mp3',volume:80,ai:true}]});
put('R02',{...seeds.R01,aiReviewOpen:true});
// C10: horizontal footage still at 16:9 (8.2% of web projects).
put('H01',{activeTab:'Layouts',outputRatio:'16:9',elements:[],effects:[],audio:[],captions:{...caption(),generated:false},playhead:0});
put('U01',{activeTab:'Elements',overview:true,modal:'upload'});
for (const id of sequence('E',24)) put(id,{activeTab:'Elements',layoutId:'Split'});
for (const id of ['E03b','E07b','E14b','E16b']) put(id,{activeTab:'Elements',layoutId:'Split'});
const selected:Record<string,TrackItem> = {
  image:element('selected-image','Image','Custom Elements',2,5,pos(23,35,54,29)),
  social:element('selected-social','thinhsocial','Social Stickers',18,5,pos(31,14,41,7)),
  text:element('selected-text','ENTER TEXT HERE','Text Elements',44,5,pos(30,12,44,11)),
  reaction:element('selected-reaction','Nice shot!','Reactions',37,5,pos(23,59,48,6)),
  sticker:element('selected-sticker','Sticker','Animated Stickers',26,5,pos(43,49,18,14)),
  gif:element('selected-gif','GIF','Gifs',26,5,pos(37,42,26,18)),
  emote:{...element('selected-emote','Emote','Twitch Emotes',5,5,pos(70,73,20,12)),media:'media/emotes/ek-cool.png'},
};
const assign = (ids:string[],item:TrackItem,extras:Seed={}) => ids.forEach(id=>put(id,{
  activeTab:'Elements',layoutId:'Split',elements:[...baseElements.filter(x=>x.category!==item.category),item],selectedElementId:item.id,playhead:item.start,...extras,
}));
assign(['E02'],selected.image);
assign(['E04','E05','E06'],selected.social);
assign(['E08','E09','E10','E11','E12'],selected.text);
assign(['E13'],selected.reaction);
assign(['E15'],selected.sticker);
assign(['E17'],selected.gif);
assign(['E19','E20','E21','E22','E23'],selected.emote);
put('E24',{...seeds.E20,elements:[...baseElements,selected.emote,
  {...selected.emote,id:'selected-emote-copy',preview:pos(48,62,20,12)}],selectedElementId:'selected-emote-copy'});
put('E21',{...seeds.E20,toolbarHint:'Animate'});
put('E22',{...seeds.E20,opacityOpen:true});
put('E23',{...seeds.E20,toolbarHint:'Bring to front'});
put('E18',{...seeds.E00,playhead:5});
for (const id of sequence('F',11)) put(id,{activeTab:'Effects',layoutId:'Fullscreen',playhead:37});
put('F00',{...seeds.F00,playhead:18});
put('F08',{...seeds.F08,audio:[...baseAudio,{id:'tts-audio',label:'Nice shot',kind:'audio',category:'Text to speech',start:37,duration:3}],captions:caption('Nice shot!')});
put('F10',{...seeds.F10,duration:20.6,playhead:3});
put('F11',{...seeds.F11,playhead:0});
for (const id of sequence('A',5)) put(id,{activeTab:'Audio',layoutId:'Fullscreen',playhead:37});
for (const id of ['A00b','A03b']) put(id,{activeTab:'Audio',layoutId:'Fullscreen',playhead:37});
put('A02',{...seeds.A02,audio:baseAudio.filter(item=>item.category==='Music'),playhead:27});
put('A04',{...seeds.A04,audio:[],playhead:37});
put('A05',{...seeds.A05,audio:[],playhead:37});
for (const id of [...sequence('C',15),'C09b']) put(id,{activeTab:'Captions',layoutId:'Split',playhead:18,captions:caption()});
put('C05',{...seeds.C05,captions:caption('RELOADING.',{'AI Shake':true,'Multiple speakers':true})});
put('C06',{...seeds.C06,captions:caption('RELOADING.',{'AI Supersize':true,'Multiple speakers':true})});
put('C07',{...seeds.C07,captions:caption('RELOADING.',{Emojis:true,'Multiple speakers':true})});
put('C08',{...seeds.C08,captions:caption('RELOADING.',{'Speaker avatars':true,'Multiple speakers':true})});
for (const id of ['C10','C11','C12','C13','C14','C15']) put(id,{...seeds[id],layoutId:'Fullscreen',captions:{...caption(),preset:'WORDS YOU SING RIGHT'}});
put('C15',{...seeds.C15,captionTrackSelected:true,playhead:30});
for (const id of sequence('X',1)) put(id,{activeTab:'Export',layoutId:'Fullscreen',playhead:0});
put('X00',{...seeds.X00,duration:20.6,audio:[],elements:[],effects:[{id:'export-overlay',kind:'effect',category:'Zoom',label:'Zoom',start:5,duration:1},{id:'export-speed',kind:'effect',category:'Speed Control',label:'0.5×',start:13,duration:1}],playhead:0});
put('X01',{...seeds.X00,modal:'template',templateName:'Split'});
put('T00',{activeTab:'Export',layoutId:'Fullscreen',playhead:.3,toast:'Segment is too short to split at this position'});
put('T01',{activeTab:'Export',layoutId:'Fullscreen',playhead:3.3});
put('T02',{activeTab:'Export',layoutId:'Fullscreen',timelineZoom:1,playhead:5});
for (const id of ['x01','x02','x03','x04']) put(id,{activeTab:'Layouts',layoutId:id==='x01'?'Split':'Circle facecam',elements:[],effects:[],audio:[]});
put('x02',{...seeds.x02,safeZone:'TikTok preview',playhead:4.3});
put('x03',{...seeds.x03,safeZone:'TikTok preview',safeMenuOpen:false,playhead:4.3});
put('x05',{...seeds.E03,layoutId:'Circle facecam'});
for (const id of ['x06','x07','x08']) put(id,{...seeds.E04,activeTab:'Elements'});
const legacyEffects:Record<string,string> = {x09:'F01',x10:'F03',x11:'F05',x12:'F07',x13:'F08',x14:'F09'};
for (const [id,screenId] of Object.entries(legacyEffects)) put(id,{activeTab:'Effects',layoutId:'Fullscreen',screenId});
put('x15',{activeTab:'Audio',layoutId:'Fullscreen'});
for (const id of ['x16','x17','x18','x19','x20']) put(id,{activeTab:'Captions',layoutId:'Fullscreen',captions:caption()});
put('x21',{activeTab:'Export',layoutId:'Circle facecam',zoom:'Fit (19.4%)',playhead:55.9});
put('x22',{...seeds.x21,modal:'template',templateName:'Circle facecam',templateFields:Object.fromEntries(templateFields.map(x=>[x,!['Gifs','Sound Effects','AI Remove Silences'].includes(x)]))});
put('x23',{...seeds.x21,profileMenu:true,playhead:7});
for (const [id,seed] of Object.entries(seeds)) if(id.startsWith('x')) seeds[id]={...seed,zoom:'Fit (19.4%)'};

export const screenSeeds = seeds;
