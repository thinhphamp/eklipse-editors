import { AudioEditor } from "./AudioEditor";
import { AudioLibrary } from "./AudioLibrary";
import { useEffect, useMemo, useRef, useState } from "react";
import { PanelHeader } from "../../shell/PanelHeader";
import { useEditor } from "../../state";
import { soundCategories } from "../../data";
import media from "../../../public/media/manifest.json";
import { getEngine } from "../../engine/playback-engine";
import "./Audio.css";
import { Icon } from "../../ui/Icon";

const uploadedUrls = new Set<string>();
type Sound = {
  name: string;
  duration: string;
  category: string;
  path: string;
  seconds: number;
};
const manifestSounds: Sound[] = media.items
  .filter((x) => x.kind === "sfx" || x.kind === "music")
  .map((x) => ({
    name: x.title,
    duration: `${Math.floor((x.durationMs || 0) / 60000)}:${String(Math.floor(((x.durationMs || 0) % 60000) / 1000)).padStart(2, "0")}`,
    category: x.kind === "music" ? "Music" : x.category,
    path: x.path,
    seconds: (x.durationMs || 3000) / 1000,
  }));
const seconds = (value: string) => {
  const [m, s] = value.split(":").map(Number);
  return m * 60 + s;
};
function useAudioController() {
  const { state, actions } = useEditor();
  const [uploads, setUploads] = useState<Sound[]>([]);
  const [library, setLibrary] = useState<"Sound Effects" | "Music">(["A03", "A03b"].includes(state.screenId) ? "Music" : "Sound Effects");
  const [filter, setFilter] = useState(state.screenId === "A01" ? "Gaming" : "All");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playing, setPlaying] = useState("");
  const [trim, setTrim] = useState(false);
  const [previewStop, setPreviewStop] = useState<(() => void) | null>(null);
  const filterBar = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);
  const selected = state.audio.find((x) => x.id === state.selectedElementId);
  const editing = selected;
  const volume = editing?.volume ?? 100,
    fadeIn = editing?.fadeIn ?? 0,
    fadeOut = editing?.fadeOut ?? 0,
    offset = editing?.offset ?? 0,
    loop = !!editing?.loop;
  useEffect(() => () => previewStop?.(), [previewStop]);
  useEffect(() => {
    const release = () => {
      uploadedUrls.forEach((url) => URL.revokeObjectURL(url));
      uploadedUrls.clear();
    };
    window.addEventListener("pagehide", release);
    return () => window.removeEventListener("pagehide", release);
  }, []);
  useEffect(() => {
    if (filter === "Gaming" && filterBar.current) filterBar.current.scrollLeft = 250;
  }, [filter]);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const screen = state.screenId;
    if (!["A02", "A04", "A05", "F08", "x13"].includes(screen)) return;
    const label = screen === "A02" ? "Doom Music" : screen === "A04" || screen === "A05" ? "Chill Gaming Beat" : "Nice shot";
    const old = state.audio.find((x) => x.label === label);
    const asset =
      screen === "A04" || screen === "A05"
        ? manifestSounds.find((x) => x.category === "Music")
        : screen === "F08" || screen === "x13"
          ? media.items.find((x) => x.kind === "tts")
          : manifestSounds.find((x) => x.category === "Gaming");
    const id = old?.id || "seed-audio-" + screen;
    const item = {
      id,
      label,
      kind: "audio" as const,
      category: screen === "A04" || screen === "A05" ? "Music" : screen === "F08" || screen === "x13" ? "Text to speech" : "Gaming",
      media: asset?.path,
      start: screen === "A04" || screen === "A05" ? 0 : screen === "A02" ? 27 : 37,
      duration: screen === "A04" || screen === "A05" ? 60 : screen === "A02" ? 16 : 3,
      volume: 100,
      loop: screen === "A04" || screen === "A05",
    };
    actions.patch({
      audio: old ? state.audio : [...state.audio, item],
      selectedElementId: id,
    });
  }, []);

  const sounds = useMemo(() => manifestSounds.filter((x) => (library === "Music" ? x.category === "Music" : x.category !== "Music")), [library]);
  const visible = [...sounds, ...uploads.filter((x) => (library === "Music" ? x.category === "Music" : x.category !== "Music"))].filter(
    (x) =>
      (filter === "All" ||
        (filter === "Favorites" && favorites.includes(x.name)) ||
        (filter === "Uploaded" && x.category === "Uploaded") ||
        x.category === filter) &&
      x.name.toLowerCase().includes(search.toLowerCase()),
  );
  const add = (item: Sound) => {
    const id = actions.addItem({
      label: item.name,
      kind: "audio",
      category: item.category,
      media: item.path,
      start: item.category === "Music" ? 0 : Math.max(0, state.playhead),
      duration: item.category === "Music" ? Math.max(item.seconds, 60) : item.seconds,
      volume: 100,
      loop: item.category === "Music",
    });
    actions.patch({ selectedElementId: id });
  };
  const play = (item: Sound) => {
    previewStop?.();
    if (playing === item.name) {
      setPlaying("");
      setPreviewStop(null);
      return;
    }
    const stop = getEngine().mixer.preview(item.path, 1);
    setPreviewStop(stop);
    setPlaying(item.name);
  };
  const change = (patch: Record<string, unknown>) => {
    if (editing) actions.updateItem(editing.id, patch);
  };
  const fileChange = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      actions.notify("Max 5 MB files are allowed");
      return;
    }
    const url = URL.createObjectURL(file);
    uploadedUrls.add(url);
    const audio = new globalThis.Audio(url);
    audio.onloadedmetadata = () => {
      const length = Number.isFinite(audio.duration) ? audio.duration : 3;
      setUploads((rows) => [
        ...rows,
        {
          name: file.name,
          duration: `${Math.floor(length / 60)}:${String(Math.floor(length % 60)).padStart(2, "0")}`,
          category: "Uploaded",
          path: url,
          seconds: length,
        },
      ]);
      const id = actions.addItem({
        label: file.name,
        kind: "audio",
        category: "Uploaded",
        media: url,
        start: Math.max(0, state.playhead),
        duration: length,
        volume: 100,
      });
      actions.patch({ selectedElementId: id });
      actions.notify("Audio added to timeline");
    };
  };
  const compact = ["A00", "A00b", "A03b"].includes(state.screenId);
  return {
    state, actions, uploads, setUploads, library, setLibrary,
    filter, setFilter, search, setSearch, favorites, setFavorites,
    playing, setPlaying, trim, setTrim, previewStop, setPreviewStop,
    filterBar, selected, editing, volume, fadeIn, fadeOut,
    offset, loop, sounds, visible, add, play,
    change, fileChange, compact,
  };
}
export type AudioContext = ReturnType<typeof useAudioController>;
export function Audio() {
  const c = useAudioController();
  const { state, actions, editing, compact } = c;
  return (
    <div className={"audio-panel " + (state.screenId === "A00" ? "audio-loading " : "") + (compact ? "audio-compact" : "audio-loaded")}>
      {new URLSearchParams(location.search).get("clip") === "song-not-in-library" && <button className="audio-upload" onClick={() => { const id=actions.addItem({label:"sample-upload.m4a",kind:"audio",category:"Uploaded",media:"/prototype/media/sample-upload.m4a",start:0,duration:3,volume:100}); actions.patch({selectedElementId:id}); actions.notify("Audio added to timeline"); }}>Use sample upload</button>}
      {editing ? <AudioEditor c={c} /> : <AudioLibrary c={c} />}
    </div>
  );
}
