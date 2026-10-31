import type { Range, TrackItem } from '../state/types';
import { AudioMixer } from './audio-mixer';
import { segmentKey, segmentStart } from './layout-recipes';
import { keptRanges, playablePosition, speedAt } from './timeline-map';

export const DEMO_CLIP = 'media/demo.mp4';
const FPS = 30;
export type EngineProject = { duration: number; removedRanges: Range[]; effects: TrackItem[]; audio: TrackItem[]; clipVolume: number; clipMuted: boolean; splitPoints?: number[]; mutedParts?: string[] };

/**
 * Prototype-grade clock: one hidden <video> is the time source. Cuts are skipped,
 * Speed Control sets playbackRate, and the audio mixer follows the same time.
 */
export class PlaybackEngine {
  readonly video = document.createElement('video');
  readonly mixer = new AudioMixer();
  private project: EngineProject = { duration: 60, removedRanges: [], effects: [], audio: [], clipVolume: 100, clipMuted: false };
  private kept: Range[] = [{ start: 0, end: 60 }];
  private t = 0;
  private objectUrl: string|null = null;
  private raf = 0;
  private listeners = new Set<() => void>();
  playing = false;
  private playerVolume = 1;
  private playerMuted = false;
  setPlayerVolume(volume: number, muted: boolean) { this.playerVolume = Math.max(0,Math.min(1,volume)); this.playerMuted = muted; this.applyClipVolume(this.t); }

  constructor(src = DEMO_CLIP) {
    Object.assign(this.video, { src, preload: 'auto', playsInline: true, muted: false });
    for (const event of ['loadeddata', 'seeked']) this.video.addEventListener(event, () => this.emit());
  }

  get time() { return this.t; }
  get ready() { return this.video.readyState >= 2; }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private emit() { for (const fn of this.listeners) fn(); }

  setProject(project: EngineProject) {
    this.project = project;
    this.kept = keptRanges(project.removedRanges, project.duration);
    this.applyClipVolume(this.t);
    if (!this.playing) this.emit();
  }

  /** Replace the source clip (upload dialog: local file → object URL). */
  setSource(src: string) { this.pause(); if (this.objectUrl) URL.revokeObjectURL(this.objectUrl); this.objectUrl = src.startsWith('blob:') ? src : null; this.video.src = src; this.seek(0); }

  play() {
    this.mixer.unlock();
    let at = playablePosition(this.t, this.kept);
    if (at === null) at = this.kept[0]?.start ?? 0;
    this.seek(at);
    this.playing = true;
    void this.video.play().catch(() => { this.playing = false; this.emit(); });
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.loop);
    this.emit();
  }

  pause() {
    this.video.pause();
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.mixer.tick(this.project.audio, this.t, false, 1);
    this.emit();
  }

  /** Mutes the original clip while an audio item with style.duckClip plays (censor bleeps over each word). */
  private applyClipVolume(t: number) {
    const ducked = this.project.audio.some(a => a.style?.duckClip && t >= a.start && t < a.start + a.duration);
    const volume = ducked ? 0 : Math.max(0, Math.min(1, this.project.clipVolume / 100)) * this.playerVolume;
    if (this.video.volume !== volume) this.video.volume = volume;
    const partMuted = !!this.project.mutedParts?.includes(segmentKey(segmentStart(t, this.project.splitPoints ?? [])));
    this.video.muted = this.project.clipMuted || partMuted || this.playerMuted;
  }

  toggle() { if (this.playing) this.pause(); else this.play(); }

  seek(seconds: number) {
    const t = Math.max(0, Math.min(this.project.duration, seconds));
    this.t = t;
    this.applyClipVolume(t);
    if (Math.abs(this.video.currentTime - t) > 1 / (FPS * 2)) this.video.currentTime = t;
    if (!this.playing) this.mixer.tick(this.project.audio, t, false, 1);
    this.emit();
  }

  step(frames: number) { this.pause(); this.seek(Math.round((this.t + frames / FPS) * FPS) / FPS); }

  private loop = () => {
    if (!this.playing) return;
    const now = this.video.currentTime;
    const at = playablePosition(now, this.kept);
    if (at === null || this.video.ended) {
      this.t = this.kept[this.kept.length - 1]?.end ?? this.project.duration;
      this.pause();
      return;
    }
    if (at - now > 1e-3) this.video.currentTime = at;
    this.applyClipVolume(at);
    const rate = speedAt(at, this.project.effects);
    if (this.video.playbackRate !== rate) this.video.playbackRate = rate;
    this.t = at;
    this.mixer.tick(this.project.audio, at, true, rate);
    this.emit();
    this.raf = requestAnimationFrame(this.loop);
  };
}

let instance: PlaybackEngine|null = null;
export const getEngine = () => (instance ??= new PlaybackEngine());
