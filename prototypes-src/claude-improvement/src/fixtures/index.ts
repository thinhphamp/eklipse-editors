// Typed fixtures for the editor prototype (phase 03). Media files live in public/media
// and are referenced by path relative to the prototype base (e.g. `media/demo.mp4`).
import transcriptJson from './transcript.json';
import aiMocksJson from './ai-mocks.json';

export type SpeakerId = string;

export interface Speaker {
  id: SpeakerId;
  name: string;
  color: string;
}

export interface TranscriptWord {
  text: string;
  startMs: number;
  endMs: number;
  speaker: SpeakerId;
  /** Sentence index; emoji tags refer to it. */
  sentence: number;
}

export interface Transcript {
  source: string;
  language: string;
  durationMs: number;
  method: string;
  speakers: Speaker[];
  words: TranscriptWord[];
}

export interface TtsVoice {
  id: string;
  name: string;
  accent: string;
  /** Path under the public root, e.g. media/tts/samantha.m4a */
  file: string;
}

/** Word fields are indexes into `transcript.words`. Silence ranges are derived from word gaps, not stored. */
export interface AiMocks {
  mock: true;
  note: string;
  hookTitles: string[];
  profanity: { words: number[]; note: string };
  emojiTags: { sentence: number; emoji: string }[];
  aiShake: number[];
  aiSupersize: number[];
  ttsVoices: TtsVoice[];
  ttsSampleLine: string;
}

export type MediaKind =
  | 'video' | 'image' | 'data' | 'meme' | 'sfx' | 'music' | 'tts'
  | 'sticker-lottie' | 'sticker-webm' | 'gif' | 'emote' | 'font';

/** One entry of public/media/manifest.json (fetch it at runtime: `fetch('media/manifest.json')`). */
export interface MediaItem {
  path: string;
  kind: MediaKind;
  category: string;
  title: string;
  durationMs?: number;
  bytes: number;
  source: string;
  licence: string;
  note: string;
}

export interface MediaManifest {
  generatedBy: string;
  pathBase: string;
  count: number;
  items: MediaItem[];
}

/** public/media/waveform.json */
export interface Waveform {
  peaksPerSecond: number;
  sampleRate: number;
  durationMs: number;
  peaks: number[];
}

/** Geometry of public/media/filmstrip.jpg: tile n shows second n, row-major. */
export const filmstrip = { src: 'media/filmstrip.jpg', tileW: 160, tileH: 90, cols: 10, rows: 6, count: 60 } as const;

export const transcript = transcriptJson as Transcript;
export const aiMocks = aiMocksJson as AiMocks;

/** Gaps between words of at least `minMs` (default 700 ms), for the silence-removal mock. */
export function silenceRanges(minMs = 700, words = transcript.words, durationMs = transcript.durationMs) {
  const out: { startMs: number; endMs: number }[] = [];
  let cursor = 0;
  for (const w of words) {
    if (w.startMs - cursor >= minMs) out.push({ startMs: cursor, endMs: w.startMs });
    cursor = Math.max(cursor, w.endMs);
  }
  if (durationMs - cursor >= minMs) out.push({ startMs: cursor, endMs: durationMs });
  return out;
}

export const loadManifest = (): Promise<MediaManifest> => fetch('media/manifest.json').then((r) => r.json());
export const loadWaveform = (): Promise<Waveform> => fetch('media/waveform.json').then((r) => r.json());
