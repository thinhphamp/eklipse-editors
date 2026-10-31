const ready = async page => {
  await page.waitForSelector('#root > *');
  await page.waitForTimeout(300);
};
const canvasRatio = page => page.evaluate(() => {
  const c = document.querySelector('.phone-preview .layout-canvas canvas');
  if (!c) return 0;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let lit = 0;
  for (let i = 0; i < d.length; i += 400) if (d[i] + d[i+1] + d[i+2] > 60) lit++;
  return lit / (d.length / 400);
});
const goto = async (page,base,id) => { await page.goto(base+'?screen='+id+'&verify=1'); await ready(page); };

export async function runScenarios(page,base,check) {
  for (let i=1;i<=11;i++) {
    const id='L'+String(i).padStart(2,'0');
    try {
      await goto(page,base,id);
      await page.getByRole('button',{name:'Play',exact:true}).click();
      await page.waitForTimeout(1000);
      const ratio=await canvasRatio(page);
      check('layout '+id+' plays and paints',ratio>.3,ratio.toFixed(2));
    } catch(e) { check('layout '+id+' plays and paints',false,String(e).slice(0,90)); }
  }
  try {
    await goto(page,base,'T01');
    await page.keyboard.press('Meta+0');
    const ruler=await page.locator('.ruler').boundingBox();
    const seek=async s=>page.mouse.click(ruler.x+ruler.width*s/60,ruler.y+ruler.height/2);
    // Split needs a selected segment (as in the reference editor): click the video track at the time, then split.
    const track=await page.locator('.timeline-track.video').boundingBox();
    const splitAt=async s=>{await seek(s);await page.mouse.click(track.x+track.width*s/60,track.y+track.height/2);await seek(s);await page.getByRole('button',{name:/^Split clip at current time/}).first().click();};
    await splitAt(10); await splitAt(15);
    await page.getByRole('button',{name:'Video segment 2'}).click();
    await page.getByRole('button',{name:/^Delete selected/}).first().click();
    const after=await page.locator('.timecode span').last().textContent();
    const rulerEnd=await page.locator('.ruler span').last().textContent();
    await page.mouse.click(ruler.x+ruler.width*9/55,ruler.y+ruler.height/2);
    await page.getByRole('button',{name:'Play',exact:true}).click();
    await page.waitForTimeout(2300);
    const jumped=await page.locator('.timecode b').textContent();
    await page.keyboard.press('Meta+z');
    const undone=await page.locator('.timecode span').last().textContent();
    const playhead=await page.evaluate(()=>window.__verify.engine.time);
    check('split delete skip undo',after?.startsWith('0:55')&&rulerEnd==='00:55'&&Number(jumped?.split(':')[1])>=10&&Number(jumped?.split(':')[1])<15&&playhead>=15&&undone?.startsWith('1:00'),`${after} ruler=${rulerEnd} ${jumped} source=${playhead} ${undone}`);
  } catch(e) { check('split delete skip undo',false,String(e).slice(0,100)); }
  try {
    await goto(page,base,'F03');
    await page.keyboard.press('Meta+0');
    const ruler=await page.locator('.ruler').boundingBox();
    await page.mouse.click(ruler.x+ruler.width*20/60,ruler.y+ruler.height/2);
    await page.getByRole('button',{name:/Speed up/}).first().click();
    await page.evaluate(()=>{const {state,actions}=window.__verify;const item=state.effects.find(x=>x.category==='Speed Control'&&x.speed===2);if(item)actions.updateItem(item.id,{duration:4})});
    const chip=page.locator('.timeline-chip.effect.kind-speed-control').last();
    const added=await chip.count()>=1;
    // Speed is read from the project (the reference editor has no separate playback-rate slider).
    const rate=await page.evaluate(()=>String(window.__verify.state.effects.find(x=>x.category==='Speed Control'&&x.speed===2)?.speed??null));
    await page.getByRole('button',{name:'Play',exact:true}).click();
    const start=await page.locator('.timecode b').textContent();
    await page.waitForTimeout(1100);
    const end=await page.locator('.timecode b').textContent();
    const parse=s=>Number(s?.split(':')[1]||0);
    const length=await page.evaluate(()=>window.__verify.state.effects.find(x=>x.category==='Speed Control'&&x.speed===2)?.duration);
    check('speed 2x segment 20-24s',added&&rate==='2'&&length===4&&parse(end)-parse(start)>1.6,`${rate} ${length}s ${start}->${end}`);
  } catch(e) { check('speed 2x segment',false,String(e).slice(0,100)); }
  try {
    await goto(page,base,'F01');
    const ruler=await page.locator('.ruler').boundingBox();
    await page.mouse.click(ruler.x+ruler.width*44/60,ruler.y+ruler.height/2);
    await page.waitForTimeout(250);
    const pixels=()=>page.evaluate(()=>{const c=document.querySelector('.phone-preview .layout-canvas canvas');return Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).filter((_,i)=>i%199===0).slice(0,1000).join(',')});
    const zoomed=await pixels();
    await page.locator('.timeline-chip.effect.kind-zoom').first().click();
    await page.getByRole('button',{name:'Delete selected'}).first().click();
    await page.waitForTimeout(200);
    check('zoom changes canvas pixels',zoomed!==await pixels());
  } catch(e) { check('zoom changes canvas pixels',false,String(e).slice(0,100)); }
  try {
    await goto(page,base,'C01');
    if (!(await page.locator('.captions-setup').isVisible())) await page.getByRole('button',{name:'Caption style and language'}).click();
    await page.getByRole('button',{name:'Generate captions'}).click();
    await page.waitForTimeout(1800);
    const generated=await page.evaluate(()=>window.__verify?.state.captions.generated);
    const setupVisible=await page.locator('.captions-setup').isVisible().catch(()=>false);
    check('caption generation completes',!!generated&&!setupVisible,`generated=${generated} setup=${setupVisible}`);
    const samples=[];
    for(const [time,word] of [[7.2,'Reloading.'],[15.5,'Ah,'],[18.1,'Jett.']]) {
      await page.evaluate(t=>window.__verify.engine.seek(t),time);
      await page.waitForTimeout(150);
      const shown=await page.locator('.preview-caption').getAttribute('data-caption-text');
      samples.push([word,shown,shown?.includes(word)]);
    }
    check('captions match transcript at 3 times',samples.every(x=>x[2]),JSON.stringify(samples));
    await page.getByRole('tab',{name:/Presets/}).click();
    const styles=[];
    for(const index of [0,1,2]) {
      await page.locator('.captions-preset-grid .captions-preset-tile').nth(index).click();
      await page.waitForTimeout(100);
      styles.push(await page.locator('.caption-content').getAttribute('style'));
    }
    check('3 caption presets change style',new Set(styles).size===3,String(new Set(styles).size));
  } catch(e) { check('caption scenarios',false,String(e).slice(0,100)); }
  try {
    await goto(page,base,'E00');
    const categories=['Custom Elements','Social Stickers','Text Elements','Reactions','Animated Stickers','Gifs','Twitch Emotes'];
    await page.evaluate(()=>window.__verify.actions.commit({elements:[]},'Clear verification elements'));
    await page.evaluate(cats=>{const {actions}=window.__verify;cats.forEach((category,i)=>actions.addItem({label:'Verify '+i,kind:'element',category,start:i*5+1,duration:2,preview:{x:30,y:30,width:30,height:12,opacity:100}}))},categories);
    const seen=[];
    for(let i=0;i<7;i++){
      await page.evaluate(t=>window.__verify.engine.seek(t),i*5+1.5);
      await page.waitForTimeout(80);
      seen.push(await page.locator('.preview-item').count());
    }
    check('7 element categories visible only in range',seen.every(n=>n===1),seen.join(','));
  } catch(e) { check('7 element categories',false,String(e).slice(0,100)); }
  try {
    await goto(page,base,'A04');
    await page.evaluate(()=>{window.__verify.actions.commit({audio:[
      {id:'verify-sfx',label:'SFX',kind:'audio',category:'SFX',start:1,duration:2,media:'media/sfx/alerts-notifications-talent-show-buzzer.mp3'},
      {id:'verify-music',label:'Music',kind:'audio',category:'Music',start:1,duration:2,media:'media/music/chill-lofi.m4a'},
      {id:'verify-tts',label:'TTS',kind:'audio',category:'Text to speech',start:1,duration:2,media:'media/tts/samantha.m4a'}
    ]},'Verify audio')});
    await page.waitForTimeout(200);
    await page.evaluate(()=>{window.__verify.engine.seek(1);window.__verify.engine.play()});
    await page.waitForTimeout(750);
    const ids=await page.evaluate(()=>window.__verify.engine.mixer.activeIds());
    check('SFX music TTS active voices',ids.length===3,ids.join(','));
  } catch(e) { check('SFX music TTS active voices',false,String(e).slice(0,100)); }
  try {
    await goto(page,base,'L04');
    await page.evaluate(()=>window.__verify.actions.commit({splitPoints:[30],segmentLayouts:{'30':'Fullscreen'}},'Verify segment layout'));
    const pixels=()=>page.evaluate(()=>{const c=document.querySelector('.phone-preview .layout-canvas canvas');return Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).filter((_,i)=>i%199===0).slice(0,1000).join(',')});
    await page.evaluate(()=>window.__verify.engine.seek(29.8)); await page.waitForTimeout(150); const before=await pixels();
    await page.evaluate(()=>window.__verify.engine.seek(30.2)); await page.waitForTimeout(150); const after=await pixels();
    check('per-segment layout changes at 30s',before!==after);
  } catch(e) { check('per-segment layout changes at 30s',false,String(e).slice(0,100)); }
  try {
    await goto(page,base,'X00');
    await page.locator('.export-primary').click();
    const opened=await page.getByRole('dialog',{name:'Export progress'}).isVisible();
    await page.getByRole('button',{name:'Cancel'}).click();
    const cancelled=!(await page.getByRole('dialog',{name:'Export progress'}).isVisible());
    check('export cancel',opened&&cancelled);
    await page.locator('.export-primary').click();
    await page.getByRole('link',{name:/Download demo file/}).waitFor({timeout:20000});
    const href=await page.getByRole('link',{name:/Download demo file/}).getAttribute('href');
    check('export done and download',href==='media/demo.mp4',String(href));
  } catch(e) { check('export flow',false,String(e).slice(0,100)); }
}
