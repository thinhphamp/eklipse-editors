import { useSyncExternalStore } from 'react';
import { captionsFail } from '../../../start/scenarios';

// cap-d1 · W3 (Quan, 30 Oct): generating captions is a background job, so it keeps running while the user edits other
// tabs (design-drafts/261030-captions-tab, variant W3). ~30 s is a placeholder for the real transcription time;
// `?capjob=<seconds>` shortens it for demos and probes, `?captions=fail` makes it fail at ~55 %.
export type CaptionJob = { phase: 'idle' | 'run' | 'done' | 'fail'; startedAt: number; ms: number; language: string; seen: boolean; queuedExport: boolean };
const param = Number(new URLSearchParams(location.search).get('capjob'));
export const captionJobMs = param > 0 ? param * 1000 : 30000;
export const captionJobFails = captionsFail;
let job: CaptionJob = { phase: 'idle', startedAt: 0, ms: captionJobMs, language: 'English', seen: true, queuedExport: false };
const listeners = new Set<() => void>();
function set(change: Partial<CaptionJob>) { job = { ...job, ...change }; listeners.forEach(l => l()); }
export const getCaptionJob = () => job;
export const useCaptionJob = () => useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => job);
export const startCaptionJob = (language: string) => set({ phase: 'run', startedAt: performance.now(), ms: captionJobMs, language, seen: true, queuedExport: false });
export const cancelCaptionJob = () => set({ phase: 'idle', queuedExport: false });
export const finishCaptionJob = (seen: boolean) => set({ phase: 'done', seen });
export const failCaptionJob = (seen: boolean) => set({ phase: 'fail', seen, queuedExport: false });
export const markCaptionJobSeen = () => { if (!job.seen) set({ seen: true }); };
export const queueExportAfterCaptions = (on: boolean) => set({ queuedExport: on });
export const captionJobProgress = (now = performance.now()) => job.phase === 'run' ? Math.min(1, (now - job.startedAt) / job.ms) : job.phase === 'done' ? 1 : 0;
export const captionJobSecondsLeft = (now = performance.now()) => Math.max(1, Math.ceil((1 - captionJobProgress(now)) * job.ms / 1000));
