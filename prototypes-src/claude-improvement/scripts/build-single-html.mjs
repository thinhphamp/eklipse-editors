// Builds one self-contained HTML file (code, CSS, fonts, icons and every file in public/media
// embedded) that runs when opened from disk. Usage: npx vite build --mode single && node scripts/build-single-html.mjs <out.html>
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, extname, dirname } from 'node:path';

const root = new URL('../dist-single/', import.meta.url).pathname;
const out = process.argv[2] || new URL('../dist-downloads/eklipse-editor-prototype.html', import.meta.url).pathname;
const types = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
const walk = dir => readdirSync(dir).flatMap(f => statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]);
const b64 = f => readFileSync(f).toString('base64');

let html = readFileSync(join(root, 'prototype.html'), 'utf8');
// CSS: inline, with font URLs turned into data URIs.
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g, (_, href) => {
  let css = readFileSync(join(root, href), 'utf8');
  css = css.replace(/url\((['"]?)((?:\.\.\/|\.\/)?fonts\/[^)'"]+)\1\)/g, (m, q, p) => {
    const file = join(root, p.replace(/^(\.\.\/|\.\/)/, ''));
    return `url(data:font/woff2;base64,${b64(file)})`;
  });
  return `<style>${css}</style>`;
});
// Embedded public files, keyed by the relative path the app requests (media/..., fonts/..., favicon.svg).
const embedded = {};
for (const file of walk(root)) {
  const rel = relative(root, file);
  if (rel === 'prototype.html' || rel.startsWith('assets/') || rel === 'icons/sprite.svg') continue;
  embedded[rel] = [types[extname(file)] || 'application/octet-stream', b64(file)];
}
const sprite = readFileSync(join(root, 'icons/sprite.svg'), 'utf8').replace(/<\?xml[^>]*>/, '').replace('<svg', '<svg aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"');
const shim = `<script>(()=>{
const data=JSON.parse(document.getElementById('embedded-files').textContent);const cache={};
const key=u=>{if(typeof u!=='string')return null;const p=u.replace(/^\\.\\//,'').split(/[?#]/)[0];return data[p]?p:null};
const blob=p=>cache[p]||(cache[p]=URL.createObjectURL(new Blob([Uint8Array.from(atob(data[p][1]),c=>c.charCodeAt(0))],{type:data[p][0]})));
const map=u=>{if(typeof u==='string'&&/^\\.?\\/?icons\\/sprite\\.svg#/.test(u))return u.slice(u.indexOf('#'));const k=key(u);return k?blob(k):u};
window.__embeddedUrl=map;
const f=window.fetch.bind(window);window.fetch=(u,o)=>f(typeof u==='string'?map(u):u,o);
for(const C of [HTMLImageElement,HTMLMediaElement,HTMLSourceElement]){const d=Object.getOwnPropertyDescriptor(C.prototype,'src');Object.defineProperty(C.prototype,'src',{get:d.get,set(v){d.set.call(this,map(v))},configurable:true})}
const sa=Element.prototype.setAttribute;Element.prototype.setAttribute=function(n,v){return sa.call(this,n,(n==='src'||n==='href'||n==='xlink:href'||n==='poster')?map(v):v)};
const sn=Element.prototype.setAttributeNS;Element.prototype.setAttributeNS=function(ns,n,v){return sn.call(this,ns,n,/href$/.test(n)?map(v):v)};
const css=v=>typeof v==='string'?v.replace(/url\\((["']?)((?:\\.\\/)?(?:media|fonts|icons)\\/[^)"']+)\\1\\)/g,(m,q,p)=>'url('+map(p)+')'):v;
for(const prop of ['backgroundImage','background','maskImage','webkitMaskImage']){const d=Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype,prop);if(d&&d.set)Object.defineProperty(CSSStyleDeclaration.prototype,prop,{get:d.get,set(v){d.set.call(this,css(v))},configurable:true})}
const sp=CSSStyleDeclaration.prototype.setProperty;CSSStyleDeclaration.prototype.setProperty=function(n,v,pr){return sp.call(this,n,css(v),pr)};
const fix=el=>{const s=el.getAttribute&&el.getAttribute('style');if(s&&/url\\(["']?(\\.\\/)?(media|fonts|icons)\\//.test(s))sa.call(el,'style',s.replace(/url\\((["']?)((?:\\.\\/)?(?:media|fonts|icons)\\/[^)"']+)\\1\\)/g,(m,q,p)=>'url('+map(p)+')'))};
new MutationObserver(ms=>{for(const m of ms){if(m.type==='attributes')fix(m.target);else m.addedNodes.forEach(n=>{if(n.nodeType===1){fix(n);n.querySelectorAll&&n.querySelectorAll('[style]').forEach(fix)}})}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
})();</script>`;
html = html.replace('</head>', `<script type="application/json" id="embedded-files">${JSON.stringify(embedded)}</script>${shim}</head>`);
// JS: inline the single module bundle.
html = html.replace(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/, (_, src) => `<script type="module">${readFileSync(join(root, src), 'utf8').replace(/<\/script/g, '<\\/script')}</script>`);
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '').replace('<body>', '<body>' + sprite);
html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="data:image/svg+xml;base64,${b64(join(root, 'favicon.svg'))}">`);
if (/src="\.\/assets\/|href="\.\/assets\//.test(html)) throw new Error('an asset reference was not inlined');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log('wrote', out, (html.length / 1048576).toFixed(1) + ' MB', Object.keys(embedded).length + ' embedded files');
