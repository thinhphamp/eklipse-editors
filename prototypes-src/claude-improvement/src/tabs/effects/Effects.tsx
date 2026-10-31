import { fxStart } from "./variants/fx-start";
import { ElTiming } from "../elements/variants/ElTiming";
import { hasVariant } from "../../variant";
import { cards, rootCards, deepPages, voices, faces, words, art, type Page } from './EffectsData';
import { EffectsRoot } from "./EffectsRoot";
import { EffectsZoom } from "./EffectsZoom";
import { EffectsSpeed } from "./EffectsSpeed";
import { EffectsSlow } from "./EffectsSlow";
import { EffectsGrid } from "./EffectsGrid";
import { EffectsCensor } from "./EffectsCensor";
import { EffectsText } from "./EffectsText";
import { EffectsSilence } from "./EffectsSilence";
import { useEffect, useRef, useState } from "react";
import { PanelHeader } from "../../shell/PanelHeader";
import { TileGrid } from "../../ui/TileGrid";
import { ToggleRow } from "../../ui/ToggleRow";
import { aiMocks, transcript, silenceRanges } from "../../fixtures";
import { MockBadge, mockDelay } from "../../ui/MockBadge";
import { shaderPresets } from "../../data";
import { useEditor, type TrackItem } from "../../state";
import "./Effects.css";
import { Icon } from "../../ui/Icon";
import { isIconName } from "../../ui/icon-map";
import { getEngine } from "../../engine/playback-engine";
import { usePremium } from "../../ui/premium";

function useEffectsController() {
  const { state, actions } = useEditor();
  const premium = usePremium();
  const [page, setPage] = useState<Page>(deepPages[state.screenId] || "root");
  const [animation, setAnimation] = useState("None");
  const [animationOpen, setAnimationOpen] = useState(state.screenId === "F02");
  const [zoomLevel, setZoomLevel] = useState(60);
  const [savedZooms, setSavedZooms] = useState(0);
  const [speed, setSpeed] = useState("0.5×");
  const [muteClip, setMuteClip] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState(state.screenId === "F06" ? "Shake" : "");
  const [censorOn, setCensorOn] = useState(true);
  const [sound, setSound] = useState("Mute");
  const [soundOpen, setSoundOpen] = useState(state.screenId === "F07");
  const [censored, setCensored] = useState<number[]>([]);
  const [text, setText] = useState(state.screenId === "F11" ? "Insane\nclutch play" : "Enter text\nhere");
  const [voice, setVoice] = useState("Kai Cement");
  const [sensitivity, setSensitivity] = useState(0.5);
  const [padding, setPadding] = useState(0.1);
  const [busy, setBusy] = useState(false);
  const [editTab, setEditTab] = useState("Edit");
  const [hookIndex, setHookIndex] = useState(0);
  const [focus, setFocus] = useState({ x: 0.5, y: 0.5 });
  const [dragging, setDragging] = useState(false);
  const voicePreview = useRef<(() => void) | null>(null);
  const activeEffect = state.effects.find((x) => x.id === state.selectedElementId);
  useEffect(() => () => voicePreview.current?.(), []);
  const addEffect = (label: string, category: string, extra: Record<string, unknown> = {}) =>
    actions.addItem({
      label,
      kind: "effect",
      category,
      start: fxStart(state, typeof extra.duration === "number" ? extra.duration : 5, Math.max(0, state.playhead)),
      duration: 5,
      ...extra,
    });
  const [removed, setRemoved] = useState(state.screenId === "F10");
  const initialized = useRef(false);
  const seed = (item: Omit<TrackItem, "id">) => {
    const record = {
      ...item,
      id: "seed-" + state.screenId + "-" + item.category,
    };
    if (item.kind === "element") actions.patch({ elements: [...state.elements, record] });
    else if (item.kind === "effect") actions.patch({ effects: [...state.effects, record] });
  };
  useEffect(() => {
    if (initialized.current || !deepPages[state.screenId]) return;
    initialized.current = true;
    if (state.screenId === "F08" && state.routeId !== 'x13') {
      // Load the destination panel before switching so deep links never flash an empty panel.
      void import('../audio/Audio').then(() => actions.patch({ activeTab: "Audio", selectedElementId: 'tts-audio' }));
      return;
    }
    const p = deepPages[state.screenId];
    actions.pushPage({
      type: "detail",
      title: p === "slow" ? "Slow motion" : cards.find((c) => c[3] === p)?.[0] || p,
    });
    if (p === "zoom" && !state.effects.some((item) => item.category === "Zoom"))
      seed({
        label: "Zoom",
        kind: "effect",
        category: "Zoom",
        start: 38,
        duration: 5,
        zoom: 1.6,
        focus: { x: 0.5, y: 0.5 },
      });
    if (p === "slow" && !state.effects.some((item) => item.category === "Speed Control"))
      seed({
        label: "0.5×",
        kind: "effect",
        category: "Speed Control",
        start: 37,
        duration: 3,
      });
    if (state.screenId === "F06" && !state.effects.some((item) => item.label === "Shake"))
      seed({
        label: "Shake",
        kind: "effect",
        category: "Effects",
        start: 15,
        duration: 0.8,
      });
    if (p === "hook" && !state.elements.some((item) => item.label === "Insane clutch play"))
      seed({
        label: "Insane clutch play",
        kind: "element",
        category: "Text Elements",
        start: 0,
        duration: 5,
      });
    if (state.screenId === "F10") actions.patch({ duration: 20.6 });
  }, []);
  useEffect(() => {
    if (!state.subPages.length) {
      if (!deepPages[state.screenId]) setPage("root");
      return;
    }
    const current = state.subPages[state.subPages.length - 1];
    if (current.category === "Zoom" || current.title === "Zoom") setPage("zoom");
    else if (current.category === "Speed Control") setPage("slow");
    else if (current.category === "Effects" || shaderPresets.some((p) => p.name === current.title)) setPage("grid");
    else if (current.title === "AI - Word censoring") setPage("censor");
    else if (current.title === "AI - Remove silences") setPage("silence");
    else if (current.title === "Text to speech") setPage("tts");
    else if (current.title === "AI - Hook intro title") setPage("hook");
  }, [state.subPages]);
  const navigate = (p: Page) => {
    const gate: Partial<Record<Page, Parameters<typeof premium.require>[0]>> = {
      zoom: "zoom-segments",
      speed: "speed-control",
      grid: "shader-effects",
      censor: "filter-profanity",
      tts: "text-to-speech",
      silence: "remove-silences",
      hook: "intro-hook",
    };
    if (gate[p] && !premium.require(gate[p])) return;
    setPage(p);
    actions.pushPage({
      type: "detail",
      title: cards.find((c) => c[3] === p)?.[0] || p,
    });
    if (p === "zoom" && !state.effects.some((item) => item.category === "Zoom"))
      seed({
        label: "Zoom",
        kind: "effect",
        category: "Zoom",
        start: fxStart(state, 5, Math.max(0, state.playhead)),
        duration: 5,
        zoom: 1 + zoomLevel / 100,
        focus,
      });
    if (p === "zoom" && hasVariant("fx-timing")) actions.patch({ selectedElementId: "seed-" + state.screenId + "-Zoom" });
    if (p === "hook") {
      setText(aiMocks.hookTitles[hookIndex % aiMocks.hookTitles.length]);
    }
  };
  const back = () => {
    setPage(page === "slow" ? "speed" : "root");
    actions.popPage();
  };
  const heading = (name: string, sub?: string, backTo = "Effects") => (
    <>
      <button className="effects-back" onClick={back}>
        ← &nbsp; Back to {backTo}
      </button>
      <PanelHeader title={name} subtitle={sub} />
      {hasVariant("fx-timing") && activeEffect && <ElTiming list="effects" />}
    </>
  );
  const icon = (v: string) => <span className="effects-icon">{isIconName(v) ? <Icon name={v} size={22} /> : v}</span>;
  return {
    state, actions, premium, page, setPage, animation,
    setAnimation, animationOpen, setAnimationOpen, zoomLevel, setZoomLevel, savedZooms,
    setSavedZooms, speed, setSpeed, muteClip, setMuteClip, selectedEffect,
    setSelectedEffect, censorOn, setCensorOn, sound, setSound, soundOpen,
    setSoundOpen, censored, setCensored, text, setText, voice,
    setVoice, sensitivity, setSensitivity, padding, setPadding, busy,
    setBusy, editTab, setEditTab, hookIndex, setHookIndex, focus,
    setFocus, dragging, setDragging, voicePreview, activeEffect, addEffect,
    removed, setRemoved, seed, navigate, back, heading,
    icon, cards: rootCards, voices, faces, words, art,
  };
}
export type EffectsContext = ReturnType<typeof useEffectsController>;
export function Effects() {
  const c = useEffectsController();
  return (
    <div className={"effects-panel effects-page-" + c.page}>
      <EffectsRoot c={c} />
      <EffectsZoom c={c} />
      <EffectsSpeed c={c} />
      <EffectsSlow c={c} />
      <EffectsGrid c={c} />
      <EffectsCensor c={c} />
      <EffectsText c={c} />
      <EffectsSilence c={c} />
    </div>
  );
}
