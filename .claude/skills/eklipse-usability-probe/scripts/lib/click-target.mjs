// Click-time resolution of a numbered item. The player clicks "[n]" from its last look; at click time we
// re-find that exact element (window.__probeEls, filled by browserLook), scroll it into view and decide
// what a real user would get: a click, a disabled no-op, or a click that lands on whatever covers it.

// Runs inside the page. Self-contained (it is serialized by Playwright).
export function resolveClickTarget(idx) {
  const el = (window.__probeEls || [])[idx];
  if (!el || !el.isConnected) return { gone: true };
  const cs = getComputedStyle(el);
  const disabled = !!(el.disabled || el.closest('[disabled],[aria-disabled=true]') || cs.pointerEvents === 'none');
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  const r = el.getBoundingClientRect();
  const l = Math.max(r.left, 0), t = Math.max(r.top, 0), rt = Math.min(r.right, innerWidth), b = Math.min(r.bottom, innerHeight);
  if (rt - l < 1 || b - t < 1) return { gone: true };
  const related = h => !!h && (h === el || el.contains(h) || h.contains(el));
  const label = h => {
    const n = h.closest('button,a,[role=button],[role=tab]') || h;
    const txt = (n.getAttribute('aria-label') || n.getAttribute('title') || n.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    return txt || `${n.tagName.toLowerCase()}${n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/)[0] : ''}`;
  };
  // Prefer the centre; else any point of the element that is not covered; else the centre, covered.
  const fr = [0.5, 0.25, 0.75, 0.1, 0.9];
  let first = null;
  for (const fy of fr) for (const fx of fr) {
    const x = Math.round(l + (rt - l) * fx), y = Math.round(t + (b - t) * fy);
    const hit = document.elementFromPoint(x, y);
    if (!first) first = { x, y, hit };
    if (related(hit)) return { x, y, disabled };
  }
  return { x: first.x, y: first.y, disabled, coveredBy: first.hit ? label(first.hit) : 'nothing' };
}

// Pure: turn the in-page answer into the step outcome the player sees.
export function clickVerdict(info, target) {
  if (!info || info.gone) return { outcome: 'no-target', msg: 'nothing to click there: that item is no longer on screen' };
  if (info.disabled) return { outcome: 'disabled', msg: `that ${/^\w+ "/.test(target || '') ? target.split(' ')[0] : 'item'} is disabled, nothing happened` };
  const point = { x: info.x, y: info.y };
  if (info.coveredBy) return { outcome: 'ok', point, covered: info.coveredBy, msg: `clicked ${target}, but "${info.coveredBy}" is on top of it, so that is what the click hit` };
  return { outcome: 'ok', point, msg: `clicked ${target}` };
}
