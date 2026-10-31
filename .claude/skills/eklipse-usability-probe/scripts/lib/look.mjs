// Player's view of the page: visible, on-screen, interactive elements and short text, as a numbered list.
// browserLook() runs inside the page. formatLook() turns its result into compact text for an LLM.
export async function settleScroll() {
  // Capture numbered coordinates only after smooth scrolling stops. Never wait on animated media.
  const nodes = [document.scrollingElement, ...document.querySelectorAll('*')].filter(el => el && (el.scrollHeight > el.clientHeight + 4 || el.scrollWidth > el.clientWidth + 4));
  const positions = () => nodes.map(el => `${el.scrollTop},${el.scrollLeft},${el.scrollHeight}`).join(';');
  let previous = positions(), stable = 0;
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const current = positions();
    stable = current === previous ? stable + 1 : 0;
    if (stable >= 3) return;
    previous = current;
  }
}

// Pure decisions (mirrored inline in browserLook, which must stay self-contained to be serialized).
// Topmost modal: highest z-index, ties go to the later one in DOM order. Input: [{z, visible}] in DOM order.
export function pickTopModal(cands) {
  let best = -1;
  cands.forEach((c, i) => { if (c.visible && (best < 0 || (c.z || 0) >= (cands[best].z || 0))) best = i; });
  return best;
}
// Listed when any sample point hits the element itself or a relative; hits = booleans per sample point.
export const isReachable = hits => hits.some(Boolean);

export function browserLook(cap) {
  const vw = innerWidth, vh = innerHeight;
  const items = [], scrollers = [];
  // Live element handles for click-time re-resolution (a JS property, not a DOM change).
  const els = window.__probeEls = [];
  const INTERACTIVE = 'button,a[href],input,textarea,select,summary,[role=button],[role=tab],[role=menuitem],[role=option],[role=checkbox],[role=switch],[role=slider],[role=radio],[contenteditable=true]';
  const TEXT = 'h1,h2,h3,h4,h5,h6,label,legend,[role=status],[role=alert],[role=heading],p,li,span,div,small,strong';
  const inter = (a, b) => ({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const related = (el, h) => {
    if (!h) return false;
    for (let n = el; n; n = n.parentNode || n.host) if (n === h) return true;
    for (let n = h; n; n = n.parentNode || n.host) if (n === el) return true;
    return false;
  };
  // Real users reach an element only if something of it is not covered: 5x5 sample grid, first hit wins.
  const FR = [0.5, 0.25, 0.75, 0.1, 0.9];
  function reachable(el, v) {
    for (const fy of FR) for (const fx of FR) {
      const h = (el.getRootNode().elementFromPoint ? el.getRootNode() : document).elementFromPoint(Math.round(v.l + (v.r - v.l) * fx), Math.round(v.t + (v.b - v.t) * fy));
      if (related(el, h)) return true;
    }
    return false;
  }
  const clean = s => (s || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  function nameOf(el) {
    const lbl = el.getAttribute('aria-label') || el.getAttribute('title');
    if (lbl) return clean(lbl);
    if (el.labels && el.labels[0]) return clean(el.labels[0].innerText);
    return clean(el.innerText || el.getAttribute('placeholder') || el.getAttribute('alt'));
  }
  function walk(el, clip, inInteractive) {
    if (!(el instanceof HTMLElement || el instanceof SVGElement)) return;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.opacity === '0' || el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('inert')) return;
    let c = clip;
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const r = el.getBoundingClientRect();
      c = inter(clip, { l: r.left, t: r.top, r: r.right, b: r.bottom });
      if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 4 && r.width > 0)
        scrollers.push({ el, first: items.length, up: el.scrollTop > 4, down: el.scrollTop + el.clientHeight < el.scrollHeight - 4 });
    }
    const r = el.getBoundingClientRect();
    const v = inter(inter({ l: r.left, t: r.top, r: r.right, b: r.bottom }, c), { l: 0, t: 0, r: vw, b: vh });
    const onScreen = v.r - v.l > 2 && v.b - v.t > 2;
    let childInteractive = inInteractive;
    if (onScreen && cs.visibility !== 'hidden') {
      const isInter = el.matches(INTERACTIVE) || (!inInteractive && cs.cursor === 'pointer' && !el.querySelector(INTERACTIVE));
      const pt = { x: Math.round((v.l + v.r) / 2), y: Math.round((v.t + v.b) / 2) };
      if (isInter && !inInteractive) {
        const tag = el.tagName.toLowerCase(), role = el.getAttribute('role');
        const kind = tag === 'input' || tag === 'textarea' ? (el.type === 'checkbox' || el.type === 'radio' ? el.type : 'textbox')
          : tag === 'select' ? 'select' : tag === 'a' ? 'link' : role || (tag === 'button' ? 'button' : 'clickable');
        if (!reachable(el, v)) return;
        const it = { kind, name: nameOf(el), ...pt, idx: els.length };
        els.push(el);
        if (['textbox', 'select'].includes(kind)) it.value = String(el.value ?? '').slice(0, 40);
        if (el.matches('[aria-pressed=true],[aria-selected=true],[aria-checked=true],.selected,.active,.on') || el.checked) it.state = 'selected';
        if (el.disabled) it.state = 'disabled';
        items.push(it);
        childInteractive = true;
      } else if (!inInteractive && el.matches(TEXT)) {
        const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ');
        const t = clean(own);
        if (t.length > 1 && cs.visibility !== 'hidden' && !el.querySelector(INTERACTIVE) && reachable(el, v)) items.push({ kind: 'text', name: t, ...pt, idx: els.push(el) - 1 });
      }
    }
    for (const ch of el.children) walk(ch, c, childInteractive);
    if (el.shadowRoot) for (const ch of el.shadowRoot.children) walk(ch, c, childInteractive);
  }
  // The browser paints only this subtree in fullscreen; the rest still has DOM geometry.
  // An open modal dialog hides everything behind it from a real user: list only the topmost one.
  const shown0 = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.display !== 'none' && c.visibility !== 'hidden'; };
  const cands = [...document.querySelectorAll('[role=dialog][aria-modal=true],dialog[open]:modal')].filter(shown0);
  let modal = null;
  cands.forEach(e => { const z = parseInt(getComputedStyle(e).zIndex, 10) || 0; let pz = 0; for (let n = e.parentElement; n; n = n.parentElement) pz = Math.max(pz, parseInt(getComputedStyle(n).zIndex, 10) || 0); const zz = Math.max(z, pz); if (!modal || zz >= modal.z) modal = { e, z: zz }; });
  let dialog = null;
  if (modal) {
    const e = modal.e, lb = e.getAttribute('aria-labelledby');
    dialog = nameOf(e) || (lb && clean(document.getElementById(lb)?.innerText)) || clean(e.querySelector('h1,h2,h3,[role=heading]')?.innerText) || 'untitled';
  }
  // The browser paints only the fullscreen subtree; the rest still has DOM geometry.
  walk(modal ? modal.e : (document.fullscreenElement || document.body), { l: 0, t: 0, r: vw, b: vh }, false);
  const total = items.length;
  const shown = items.slice(0, cap);
  const sc = scrollers.filter(s => (s.up || s.down)).map(s => ({ first: Math.min(s.first, shown.length - 1) + 1, up: s.up, down: s.down }));
  return { items: shown, total, scrollers: sc, dialog };
}

// Merge adjacent duplicate text lines and format. Returns { text, refs } with refs[n] = {x,y,desc}.
export function formatLook(raw) {
  const refs = {}, lines = raw.dialog ? [`A dialog is open: ${raw.dialog}. Only its contents can be used until it is closed.`] : [];
  let n = 0, last = '';
  for (const it of raw.items) {
    const line = `${it.kind} "${it.name}"` + (it.value !== undefined ? ` value="${it.value}"` : '') + (it.state ? ` (${it.state})` : '');
    if (it.kind === 'text' && line === last) continue;
    last = line; n++;
    refs[n] = { x: it.x, y: it.y, idx: it.idx, desc: `${it.kind} "${it.name}"` };
    lines.push(`[${n}] ${line}`);
  }
  if (raw.total > raw.items.length) lines.push(`(${raw.total - raw.items.length} more, scroll to see)`);
  for (const s of raw.scrollers) lines.push(`(more content ${[s.up && 'above', s.down && 'below'].filter(Boolean).join(' and ')} the area around [${s.first}]: scroll ${s.down ? 'down' : 'up'} with that ref)`);
  return { text: lines.join('\n') || '(nothing visible)', refs };
}
