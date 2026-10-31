// One session = one browser context + page + action log. Used only by the broker.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { browserLook, formatLook, settleScroll } from './look.mjs';
import { sleep } from './common.mjs';
import { resolveClickTarget, clickVerdict } from './click-target.mjs';
import { evalCheck, evalCheckpoints, computeMetrics, modeledTimeSeconds } from '../judge.mjs';

const NAME_FN = el => {
  // The clicked control's own name: a labelled thumbnail inside a button must not hide the button's name.
  const t = el && el.closest ? (el.closest('button,a,[role=button],[role=tab]') || el.closest('[aria-label],[title]') || el) : el;
  const n = t ? (t.getAttribute('aria-label') || t.getAttribute('title') || t.innerText || '') : '';
  return { name: n.replace(/\s+/g, ' ').trim().slice(0, 60), rail: !!(t && t.closest('.rail')) };
};
const STEP = new Set(['click', 'drag', 'type', 'scroll', 'key']);
const UI_KEYS = ['activeTab', 'panelCollapsed', 'zoom', 'safeZone', 'safeMenuOpen', 'toast', 'profileMenu', 'opacityOpen', 'toolbarHint', 'subPages', 'modal'];

export class Session {
  constructor(o) {
    Object.assign(this, o); // id, ctx, page, probe, persona, runDir, runId, initial
    this.startedAt = Date.now();
    this.seq = 0; this.steps = 0; this.refs = {}; this.actions = [];
    this.flags = { budgetHit: false, gaveUp: false, done: false }; this.firstClickChecked = false;
    this.shotsDir = this.shotsDir || join(this.runDir, 'shots'); // opaque path: the player sees it, so no probe/persona ids in it
    mkdirSync(this.shotsDir, { recursive: true }); mkdirSync(this.runDir, { recursive: true });
  }
  pad() { return String(this.seq).padStart(3, '0'); }
  record(action, o = {}) {
    const rec = { runId: this.runId, sequence: this.seq, timestamp: new Date().toISOString(), action, target: o.target ?? null,
      screenshotRef: o.shot ?? null, outcome: o.outcome || 'ok', note: o.note ?? null, extra: o.extra || {} };
    this.actions.push(rec);
    appendFileSync(join(this.runDir, 'actions.jsonl'), JSON.stringify(rec) + '\n');
  }
  async stateHash() {
    return this.page.evaluate(k => { const s = { ...window.__verify.state }; k.forEach(x => delete s[x]); return JSON.stringify(s).length + ':' + JSON.stringify(s); }, UI_KEYS)
      .then(h => { let x = 0; for (let i = 0; i < h.length; i++) x = (x * 31 + h.charCodeAt(i)) | 0; return String(x); }).catch(() => '');
  }
  async look(shot = true) {
    await this.page.evaluate(settleScroll);
    const { text, refs } = formatLook(await this.page.evaluate(browserLook, 120));
    this.refs = refs;
    let head = '';
    if (shot) {
      const name = this.pad() + '.jpg';
      await this.page.screenshot({ path: join(this.shotsDir, name), type: 'jpeg', quality: 60 });
      head = `screenshot: ${join(this.shotsDir, name)}\n`;
      this.lastShot = name;
    }
    return head + text;
  }
  // Right first click = inside the FIRST bestPath click target, or an element with the same accessible name.
  async firstClickRight(handle, name) {
    const st = (this.probe.bestPath || []).find(x => x.do === 'click');
    if (!st) return true;
    const loc = st.selector ? this.page.locator(st.selector) : st.role ? this.page.getByRole(st.role, { name: st.name }) : this.page.getByText(st.text);
    if (await loc.evaluateAll((els, t) => els.some(e => e.contains(t)), handle).catch(() => false)) return true;
    const want = await loc.first().evaluate(NAME_FN).catch(() => null);
    if (want && name && want.name === name) return true;
    // Other routes the probe accepts as an equally good start (accessible-name patterns), e.g. the Brand chip.
    return (this.probe.firstClickAlso || []).some(rx => { try { return new RegExp(rx, 'i').test(name || ''); } catch { return false; } });
  }
  async clickMeta(handle, isFirstPlayerClick = false) {
    const extra = { ...(await handle.evaluate(NAME_FN).catch(() => ({ name: '', rail: false }))), stateHash: await this.stateHash() };
    if (isFirstPlayerClick && !this.firstClickChecked) { this.firstClickChecked = true; extra.matchesBestPath = await this.firstClickRight(handle, extra.name); }
    return extra;
  }
  async clickPoint(x, y, first = false) {
    const handle = await this.page.evaluateHandle(([a, b]) => document.elementFromPoint(a, b), [x, y]);
    const extra = await this.clickMeta(handle, first);
    await this.page.mouse.click(x, y);
    return extra;
  }
  async dragBetween(from, to) {
    if (typeof from.dragTo === 'function') return from.dragTo(to, { timeout: 4000 });
    await this.page.mouse.move(from.x, from.y);
    await this.page.mouse.down();
    await this.page.mouse.move(to.x, to.y, { steps: 8 });
    await this.page.mouse.up();
  }
  stopped() { return this.flags.done || this.flags.gaveUp || this.flags.budgetHit; }

  // Player-facing action. Returns text.
  async act(b) {
    const a = b.action;
    if (this.stopped()) { this.seq++; this.record(a, { outcome: 'stopped' }); return `stopped: ${this.flags.budgetHit ? 'budget' : 'run already ended'}`; }
    if (STEP.has(a) && this.steps >= (this.probe.checkpoints ? this.probe.budget.steps : 2 * this.probe.budget.steps)) {
      this.flags.budgetHit = true; this.seq++; this.record(a, { outcome: 'stopped' }); return 'stopped: budget';
    }
    this.seq++;
    if (a === 'look') { const t = await this.look(); this.record('look', { shot: this.lastShot }); return t; }
    if (a === 'note') { this.record('note', { note: String(b.text || '') }); return 'noted'; }
    if (a === 'done' || a === 'giveup') {
      this.flags[a === 'done' ? 'done' : 'gaveUp'] = true; this.record(a, { note: String(b.text || '') });
      return `${a}: recorded. The session is over.`;
    }
    if (!STEP.has(a)) { this.record(a, { outcome: 'error' }); return `error: unknown action ${a}`; }
    this.steps++;
    let outcome = 'ok', target = null, extra = {}, msg = '';
    try {
      if (a === 'click') {
        const beforePanel = await this.page.evaluate(() => { const s=window.__verify?.state||{}; return JSON.stringify([s.activeTab,s.subPages]); }).catch(()=> '');
        let pt = null;
        const ref = b.ref ?? (/^\d+$/.test(String(b.target)) ? b.target : null);
        if (ref != null) { const r = this.refs[ref]; if (r) { pt = r; target = r.desc; } }
        else if (/^\s*\d+\s*,\s*\d+\s*$/.test(String(b.target))) { const [x, y] = b.target.split(',').map(Number); pt = { x, y }; target = `point ${x},${y}`; }
        else if (b.target) {
          const t = String(b.target);
          search: for (const exact of [true, false]) for (const loc of [this.page.getByText(t, { exact }), this.page.getByRole('button', { name: t, exact }), this.page.getByTitle(t, { exact })]) {
            const box = await loc.locator('visible=true').first().boundingBox({ timeout: 500 }).catch(() => null);
            if (box) { pt = { x: box.x + box.width / 2, y: box.y + box.height / 2 }; target = `"${t}"`; break search; }
          }
        }
        if (!pt) { outcome = 'no-target'; target = String(b.target ?? b.ref); msg = 'nothing to click there'; }
        else {
          let verdict = { outcome: 'ok', msg: `clicked ${target}` };
          if (pt.idx != null) {
            let info;
            try { info = await this.page.evaluate(resolveClickTarget, pt.idx); }
            catch (e) { this.harnessError = 'Numbered click could not be resolved: ' + String(e.message).split('\n')[0].slice(0, 120); throw e; }
            verdict = clickVerdict(info, target);
            if (verdict.point) pt = verdict.point;
          }
          if (verdict.outcome === 'ok') {
            extra = await this.clickPoint(pt.x, pt.y, true);
            if (verdict.covered) extra.coveredBy = verdict.covered;
            const afterPanel = await this.page.evaluate(() => { const s=window.__verify?.state||{}; return JSON.stringify([s.activeTab,s.subPages]); }).catch(()=> '');
            if (afterPanel !== beforePanel && afterPanel !== '[]') extra.newPanel = afterPanel;
          } else extra = { stateHash: await this.stateHash() };
          outcome = verdict.outcome; msg = verdict.msg;
        }
      } else if (a === 'drag') {
        const from = this.refs[b.ref], to = this.refs[b.toRef];
        if (!from || !to) { outcome = 'no-target'; msg = 'drag needs two visible numbered items'; }
        else {
          target = `${from.desc} to ${to.desc}`;
          await this.dragBetween(from, to);
          extra = { fromRef: b.ref, toRef: b.toRef };
          msg = `dragged ${target}`;
        }
      } else if (a === 'type') {
        let keptFocus = false;
        if (b.ref != null && this.refs[b.ref]) {
          const { x, y } = this.refs[b.ref];
          keptFocus = await this.page.evaluate(([x, y]) => {
            const field = document.elementFromPoint(x, y)?.closest('input,textarea,[contenteditable=true]');
            return !!field && field === document.activeElement;
          }, [x, y]);
          if (!keptFocus) await this.clickPoint(x, y);
        }
        await this.page.keyboard.type(String(b.text || ''), { delay: 15 }); target = String(b.text || ''); msg = `typed "${target}"`;
        const refDesc = b.ref != null ? String(this.refs[b.ref]?.desc||'') : '';
        extra = { stateHash: await this.stateHash(), ref: b.ref ?? null, keptFocus, searchField: /search|find/i.test(refDesc) };
      } else if (a === 'scroll') {
        const r = b.ref != null && this.refs[b.ref] ? this.refs[b.ref] : { x: 640, y: 400 };
        await this.page.mouse.move(r.x, r.y); await this.page.mouse.wheel(0, b.dir === 'up' ? -600 : 600);
        target = b.dir === 'up' ? 'up' : 'down'; msg = `scrolled ${target}`;
      } else { // Ctrl and Cmd both work, like on the user's own OS
        await this.page.keyboard.press(String(b.key).replace(/\b(Control|Ctrl|Cmd|Command|Meta)\+/gi, 'ControlOrMeta+')); target = String(b.key); msg = `pressed ${target}`;
        // Synthetic Escape reaches the DOM but Chromium does not perform its native fullscreen exit.
        if (/^escape$/i.test(target)) await this.page.evaluate(async () => { if (document.fullscreenElement) await document.exitFullscreen(); });
        extra = { stateHash: await this.stateHash() };
      }
    } catch (e) { outcome = 'error'; msg = 'error: ' + String(e.message).split('\n')[0].slice(0, 120); }
    await sleep(400);
    const t = await this.look();
    this.record(a, { target, outcome, extra, shot: this.lastShot });
    return `${outcome === 'ok' ? 'ok' : outcome}: ${msg}\n${t}`;
  }

  // Scripted bestPath step (runner/best-path only).
  async playStep(s) {
    this.seq++; this.steps++;
    const beforePanel = await this.page.evaluate(() => { const state=window.__verify?.state||{}; return JSON.stringify([state.activeTab,state.subPages]); }).catch(()=> '');
    const loc = s.selector ? this.page.locator(s.selector) : s.role ? this.page.getByRole(s.role, { name: s.name }) : s.text ? this.page.getByText(s.text) : null;
    let extra = { scripted: true }, target = s.selector || s.name || s.text || s.key || '';
    const first = loc && loc.first();
    if (s.do === 'click') {
      const h = await first.elementHandle({ timeout: 4000 });
      extra = { ...(await this.clickMeta(h, true)), scripted: true };
      await first.click({ timeout: 4000, ...(Number.isFinite(s.positionRatio) ? { position: { x: (await first.boundingBox({ timeout: 4000 })).width * s.positionRatio, y: (await first.boundingBox({ timeout: 4000 })).height / 2 } } : {}) });
    } else if (s.do === 'type') {
      if (!(await first.evaluate(e => e === document.activeElement, null, { timeout: 4000 }))) await first.focus({ timeout: 4000 });
      extra.searchField = await first.evaluate(e => /search|find/i.test([e.getAttribute('placeholder'),e.getAttribute('aria-label'),e.getAttribute('name')].join(' '))).catch(()=>false);
      await this.page.keyboard.type(s.text, { delay: 10 });
    } else if (s.do === 'key') await this.page.keyboard.press(s.key);
    else if (s.do === 'scroll') { await first.hover({ timeout: 4000 }); await this.page.mouse.wheel(0, s.dy || 600); }
    else if (s.do === 'drag') await this.dragBetween(first, this.page.locator(s.to).first());
    else throw new Error('unknown step ' + s.do);
    if(s.do==='click') { const afterPanel=await this.page.evaluate(() => { const state=window.__verify?.state||{}; return JSON.stringify([state.activeTab,state.subPages]); }).catch(()=> ''); if(afterPanel!==beforePanel&&afterPanel!=='[]')extra.newPanel=afterPanel; }
    // Match the prototype path verifier's UI settle windows. Caption generation is
    // asynchronous; the primary editor action also needs a beat to commit state.
    const settleMs = s.do === 'click' && s.text === 'Generate captions' ? 500
      : s.do === 'click' && s.selector === '.captions-setup .captions-primary' ? 1500
      : s.do === 'click' && s.selector === '.tb-primary' ? 1000 : 500;
    await sleep(settleMs);
    this.record(s.do, { target, extra });
  }

  async close() { if (this.closed) return; this.closed = true; await this.ctx.close().catch(() => {}); }

  async judge(meta = {}) {
    const isFlow = !!this.probe.checkpoints;
    let checkpoints = null;
    if (isFlow) {
      const deadline = Date.now() + 6000;
      do {
        checkpoints = await evalCheckpoints(this.page, this.probe, this.initial);
        if (Object.values(checkpoints).length > 0 && Object.values(checkpoints).every(Boolean)) break;
        if (Date.now() >= deadline) break;
        await sleep(Math.min(250, deadline - Date.now()));
      } while (Date.now() < deadline);
    }
    let lastCheckpoint = null;
    if(isFlow) for(const checkpoint of this.probe.checkpoints){if(!checkpoints[checkpoint.id])break;lastCheckpoint=checkpoint.id;}
    const chk = isFlow ? { success: Object.values(checkpoints).length > 0 && Object.values(checkpoints).every(Boolean) } : await evalCheck(this.page, this.probe, this.initial);
    await this.page.screenshot({ path: join(this.runDir, 'final.jpg'), type: 'jpeg', quality: 60 }).catch(() => {});
    // Saved after the player has finished, so a checkpoint fix can be rejudged without replaying the run.
    if (isFlow) { const finalState = await this.page.evaluate(() => window.__verify?.state || null).catch(() => null); writeFileSync(join(this.runDir, 'final-state.json'), JSON.stringify({ initial: this.initial, state: finalState })); }
    const res = { runId: this.runId, probe: this.probe.id, persona: this.persona.id, success: chk.success, ...(chk.error ? { checkError: chk.error } : {}),
      ...computeMetrics(this.actions, this.probe, this.flags, meta),
      ...(isFlow ? { budget: this.probe.budget, clicks: this.actions.filter(a => a.action === 'click' && a.outcome !== 'stopped').length, bestTimeSeconds: this.probe.bestTimeSeconds } : {}),
      ...(isFlow ? { checkpoints, lastCheckpoint,
        modeledTimeSeconds: modeledTimeSeconds(this.actions), wallSeconds: Math.round((Date.now() - this.startedAt) / 100) / 10,
        journeyScore: chk.success ? Math.min(100, 60 * this.probe.bestPath.length / Math.max(1, this.steps) + 40 * (this.probe.bestTimeSeconds || modeledTimeSeconds(this.probe.bestPath.map((a, i) => ({ action: a.do, target: a.text, extra: a.do === 'click' && i === 0 ? { newPanel: 'bestpath-initial' } : {} })))) / Math.max(0.1, modeledTimeSeconds(this.actions))) : 0,
        behavior: meta.behavior, flow: meta.flow, playerId: meta.playerId, clip: meta.clip } : {}),
      ...(this.harnessError ? { executionError: this.harnessError } : {}) };
    writeFileSync(join(this.runDir, 'result.json'), JSON.stringify(res, null, 2));
    await this.close();
    return res;
  }
}
