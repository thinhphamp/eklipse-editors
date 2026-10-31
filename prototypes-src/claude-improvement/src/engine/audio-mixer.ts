import type { TrackItem } from '../state/types';

// Sound and music lanes: every tick the mixer compares what should be audible
// at the clock time with what is playing and starts, stops or re-seeks sources.
// This keeps lanes in sync through seeks, cuts and speed changes without a scheduler.
const DRIFT = .08;
type Voice = { source: AudioBufferSourceNode; gain: GainNode; startedAt: number; offset: number; rate: number };

export class AudioMixer {
  private ctx: AudioContext|null = null;
  private buffers = new Map<string, Promise<AudioBuffer|null>>();
  private ready = new Map<string, AudioBuffer|null>();
  private voices = new Map<string, Voice>();
  activeIds() { return [...this.voices.keys()]; }

  /** Must be called from a user gesture (play button) the first time. */
  unlock() {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private load(path: string) {
    if (!this.ctx) return;
    if (!this.buffers.has(path)) {
      const ctx = this.ctx;
      const task = fetch(path).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status + ' ' + path)))
        .then(data => ctx.decodeAudioData(data)).catch(() => null);
      this.buffers.set(path, task);
      void task.then(buffer => this.ready.set(path, buffer));
    }
  }

  /** Preview a file once (library "play" buttons). Returns a stop function. */
  preview(path: string, volume = 1): () => void {
    this.unlock();
    const ctx = this.ctx!;
    let stopped = false, node: AudioBufferSourceNode|null = null;
    this.load(path);
    void this.buffers.get(path)!.then(buffer => {
      if (!buffer || stopped) return;
      node = ctx.createBufferSource(); node.buffer = buffer;
      const gain = ctx.createGain(); gain.gain.value = volume;
      node.connect(gain).connect(ctx.destination); node.start();
    });
    return () => { stopped = true; try { node?.stop(); } catch { /* already stopped */ } };
  }

  /** Reconcile lanes with the clock. `playing=false` silences everything. */
  tick(items: TrackItem[], time: number, playing: boolean, rate: number) {
    const ctx = this.ctx;
    const wanted = new Set<string>();
    if (ctx && playing) for (const item of items) {
      if (!item.media) continue;
      this.load(item.media);
      const buffer = this.ready.get(item.media);
      const local = time - item.start;
      if (!buffer || local < 0 || local >= item.duration) continue;
      const offset = (item.offset ?? 0) + (item.loop ? local % buffer.duration : local);
      if (offset >= buffer.duration) continue;
      wanted.add(item.id);
      const voice = this.voices.get(item.id);
      const expected = voice ? voice.offset + (ctx.currentTime - voice.startedAt) * voice.rate : 0;
      if (!voice || Math.abs(expected - offset) > DRIFT || voice.rate !== rate) {
        this.stop(item.id);
        const source = ctx.createBufferSource(); source.buffer = buffer; source.playbackRate.value = rate;
        const gain = ctx.createGain();
        source.connect(gain).connect(ctx.destination);
        source.start(0, offset);
        this.voices.set(item.id, { source, gain, startedAt: ctx.currentTime, offset, rate });
      }
      const v = this.voices.get(item.id)!;
      const fadeIn = item.fadeIn ? Math.min(1, local / item.fadeIn) : 1;
      const fadeOut = item.fadeOut ? Math.min(1, (item.duration - local) / item.fadeOut) : 1;
      v.gain.gain.setTargetAtTime(((item.volume ?? 100) / 100) * fadeIn * fadeOut, ctx.currentTime, .02);
    }
    for (const id of [...this.voices.keys()]) if (!wanted.has(id)) this.stop(id);
  }

  private stop(id: string) {
    const voice = this.voices.get(id);
    if (!voice) return;
    try { voice.source.stop(); } catch { /* already stopped */ }
    voice.source.disconnect(); voice.gain.disconnect();
    this.voices.delete(id);
  }
}
