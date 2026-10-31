// Judge: success check on the real state + per-run metrics from the action log.
// Pure functions; the broker feeds them. Players never see this file's inputs.
const STEP = new Set(['click', 'drag', 'type', 'scroll', 'key']);
const BACK = /^(back|close|cancel|undo)\b/i; // leading arrows/icons are stripped before matching

// Evaluates probe.success.check in the page. Returns { success, error? }.
export async function evalCheck(page, probe, initial) {
  try {
    const ok = await page.evaluate(([check, init]) => {
      const f = new Function('state', 'initial', 'return (' + check + ')');
      return !!f(window.__verify.state, init);
    }, [probe.success.check, initial]);
    return { success: ok };
  } catch (e) { return { success: false, error: String(e.message || e).slice(0, 200) }; }
}

// The visible label the first bestPath click aims at: :has-text('X'), role name or text.
const firstHint = probe => {
  const st = (probe.bestPath || []).find(x => x.do === 'click') || {};
  return ((st.selector || '').match(/:has-text\(['"]([^'"]+)['"]\)/) || [])[1] || st.name || st.text || null;
};
const labelOf = target => ((target || '').match(/"(.*)"$/) || [])[1] || '';
function firstClickWrong(click, probe) {
  if (!click || !click.extra || click.extra.matchesBestPath !== false) return false;
  const label = labelOf(click.target), hint = firstHint(probe);
  if (hint && label.toLowerCase() === hint.toLowerCase()) return false;
  return !(probe.firstClickAlso || []).some(rx => { try { return new RegExp(rx, 'i').test(label); } catch { return false; } });
}

// actions: Observation records (with `extra` fields set by the broker). flags: { budgetHit, gaveUp, done }.
export function computeMetrics(actions, probe, flags = {}, meta = {}) {
  const acts = actions.filter(a => STEP.has(a.action) && a.outcome !== 'stopped');
  const clicks = acts.filter(a => a.action === 'click');
  let backtracks = 0;
  const seenTabs = new Map(); // rail tab name -> state hash when last clicked
  for (const a of acts) {
    const hash = a.extra && a.extra.stateHash;
    if (a.action === 'key' && /^escape$/i.test(a.target || '')) backtracks++;
    else if (a.action === 'click') {
      const name = (a.extra && a.extra.name || '').replace(/^[^a-z]+/i, '');
      // hash is the project state BEFORE this click; same hash as at the previous click on this tab = nothing changed since.
      if (BACK.test(name)) backtracks++;
      else if (a.extra && a.extra.rail && seenTabs.has(name) && seenTabs.get(name) === hash) backtracks++;
      if (a.extra && a.extra.rail) seenTabs.set(name, hash);
    }
  }
  const times = actions.map(a => Date.parse(a.timestamp)).filter(Number.isFinite);
  const steps = acts.length;
  const bp = (probe.bestPath || []).length || 1;
  return {
    steps,
    scrolls: acts.filter(a => a.action === 'scroll').length,
    backtracks,
    wrongFirstClick: firstClickWrong(clicks[0], probe),
    timeSec: times.length > 1 ? Math.round((Math.max(...times) - Math.min(...times)) / 100) / 10 : 0,
    gaveUp: !!flags.gaveUp,
    done: !!flags.done,
    budgetHit: !!flags.budgetHit,
    notes: actions.filter(a => a.action === 'note' && a.note).map(a => a.note),
    stepRatio: Math.round((steps / bp) * 100) / 100,
    ...meta,
  };
}

export function modeledTimeSeconds(actions) {
  let seconds = 0, panels = new Set(), searched = false;
  for (const a of actions) {
    if (a.outcome === 'stopped') continue;
    if (a.action === 'click') {
      seconds += 1.2;
      const panel = a.extra?.newPanel;
      if (panel && !panels.has(panel)) { seconds += 2; panels.add(panel); }
    } else if (a.action === 'drag') seconds += 1.5;
    else if (a.action === 'key') seconds += 0.4;
    else if (a.action === 'type') {
      seconds += String(a.target || '').length * 0.3;
      if (!searched && a.extra?.searchField) { seconds += 3; searched = true; }
    } else if (a.action === 'scroll') seconds += 1;
  }
  return Math.round(seconds * 10) / 10;
}

export async function evalCheckpoints(page, flow, initial) {
  const out = {};
  for (const cp of flow.checkpoints || []) {
    try { out[cp.id] = !!(await page.evaluate(([check, init]) => new Function('state', 'initial', `return (${check})`)(window.__verify.state, init), [cp.check, initial])); }
    catch { out[cp.id] = false; }
  }
  return out;
}
