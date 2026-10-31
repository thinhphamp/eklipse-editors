import { aiMocks, transcript } from '../../fixtures';
export type Page = "root" | "zoom" | "speed" | "slow" | "grid" | "censor" | "tts" | "silence" | "hook";
export const cards = [
  ["Zoom", "Add a zoom effect to your clip", "zoom", "zoom"],
  ["Speed Control", "Slow down or speed up a moment", "gauge", "speed"],
  ["Effects", "Add special effects to your video", "effects", "grid"],
  ["AI - Word censoring", "Make your videos TikTok friendly", "ban", "censor"],
  ["Text to speech", "Turn your text into speech", "tts", "tts"],
  ["AI - Remove silences", "Remove silent moments from your clip", "volume-off", "silence"],
  ["AI - Hook intro title", "Adds a intro hook title to the start of your clip", "type", "hook"],
] as const;
/** Cards on the Effects root (Quan, 30 Oct): Effects, Text to speech, AI - Remove silences and AI - Hook intro title are
 * off the menu. Their pages stay reachable from existing timeline items and QA screens. */
export const rootCards = cards.filter(c => ['zoom', 'speed', 'censor'].includes(c[3]));
export const deepPages: Record<string, Page> = {
  F01: "zoom",
  F02: "zoom",
  F03: "speed",
  F04: "slow",
  F05: "grid",
  F06: "grid",
  F07: "censor",
  F08: "tts",
  F09: "silence",
  F10: "silence",
  F11: "hook",
};
export const voices = ['Kai Cement', 'Glenn Quagmire', 'Casi-oh', 'Louise Griffin', 'Homie Simpson', 'Beast'];
export const faces = ["👨🏾", "👨🏻", "🧔🏽", "👩🏻", "👨🏼", "👨🏻"];
export const words = transcript.words;
export const art = ["✦", "★", "▧", "◉", "◐", "⚡", "▦", "▣", "▥"];

