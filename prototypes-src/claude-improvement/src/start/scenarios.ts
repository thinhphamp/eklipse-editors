import type { LayoutName } from '../data';

// Start from app.eklipse.gg (Quan, 30 Oct): the user picked a clip and a template in the web app, then lands in the
// editor. Loading takes a few seconds (P75 = 2 s). The editor opens with the video track only; the template's parts
// arrive in order. `?start=app` shows the scenario picker; `?start=app&scenario=<id>&load=<ms>` opens one directly.
export type ScenarioId = 'both' | 'captions' | 'channel' | 'layout';
export type Scenario = {
  id: ScenarioId; title: string; what: string;
  template: string; layout: LayoutName; captionPreset?: string; captionFlavor?: string; channel: boolean;
};
export const scenarios: Scenario[] = [
  { id: 'both', title: 'Captions + channel name', what: 'Both parts of a full template. The channel name is placed at open; captions generate while the user edits.',
    template: 'FPS hook + tag', layout: 'Split', captionPreset: 'THE HOOK.', captionFlavor: 'hook', channel: true },
  { id: 'captions', title: 'Template with captions', what: 'Captions start generating as soon as the clip is open. The user can edit while they run.',
    template: 'FPS hook', layout: 'Split', captionPreset: 'THE HOOK.', captionFlavor: 'hook', channel: false },
  { id: 'channel', title: 'Template with channel name', what: 'The saved channel name sticker is placed with the layout. Nothing runs after opening.',
    template: 'Channel tag', layout: 'Circle facecam', channel: true },
  { id: 'layout', title: 'Layout only', what: 'Only the layout is applied. No captions, no channel name: the timeline stays video only.',
    template: 'Clean facecam', layout: 'Small facecam', channel: false },
];
export const loadOptions = [{ ms: 1000, label: '1 s' }, { ms: 2000, label: '2 s · P75' }, { ms: 6000, label: '6 s · slow' }];
/** Simulated transcription time after the editor is ready. */
export const captionJobMs = 4500;

const params = () => new URLSearchParams(location.search);
export const isStartFromApp = () => params().get('start') === 'app';
export function activeScenario(): Scenario | null {
  if (!isStartFromApp()) return null;
  return scenarios.find(s => s.id === params().get('scenario')) || null;
}
/** Review switch: the caption job fails instead of finishing (`captions=fail`). */
export const captionsFail = () => params().get('captions') === 'fail';
export const loadMs = () => { const n = Number(params().get('load')); return n > 0 ? n : 2000; };
export function openScenario(id: ScenarioId, ms: number, fail = false) {
  const q = params(); q.set('start', 'app'); q.set('scenario', id); q.set('load', String(ms));
  if (fail) q.set('captions', 'fail'); else q.delete('captions');
  location.search = q.toString();
}
export function backToPicker() { const q = params(); q.delete('scenario'); q.delete('load'); q.delete('captions'); location.search = q.toString(); }
