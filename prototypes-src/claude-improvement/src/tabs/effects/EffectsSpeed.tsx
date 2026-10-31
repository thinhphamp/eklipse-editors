import { fxStart } from "./variants/fx-start";
import { PanelHeader } from "../../shell/PanelHeader";
import { TileGrid } from "../../ui/TileGrid";
import { ToggleRow } from "../../ui/ToggleRow";
import { aiMocks, transcript, silenceRanges } from "../../fixtures";
import { MockBadge, mockDelay } from "../../ui/MockBadge";
import { shaderPresets } from "../../data";
import { Icon } from "../../ui/Icon";
import { isIconName } from "../../ui/icon-map";
import { getEngine } from "../../engine/playback-engine";
import type { EffectsContext } from "./Effects";
export function EffectsSpeed({ c }: { c: EffectsContext }) {
  const {
    state,
    actions,
    premium,
    page,
    setPage,
    animation,
    setAnimation,
    animationOpen,
    setAnimationOpen,
    zoomLevel,
    setZoomLevel,
    savedZooms,
    setSavedZooms,
    speed,
    setSpeed,
    muteClip,
    setMuteClip,
    selectedEffect,
    setSelectedEffect,
    censorOn,
    setCensorOn,
    sound,
    setSound,
    soundOpen,
    setSoundOpen,
    censored,
    setCensored,
    text,
    setText,
    voice,
    setVoice,
    sensitivity,
    setSensitivity,
    padding,
    setPadding,
    busy,
    setBusy,
    editTab,
    setEditTab,
    hookIndex,
    setHookIndex,
    focus,
    setFocus,
    dragging,
    setDragging,
    voicePreview,
    activeEffect,
    addEffect,
    removed,
    setRemoved,
    seed,
    navigate,
    back,
    heading,
    icon,
      cards,
    voices,
    faces,
    words,
    art,
  } = c;
  return (
    <>
      {page === "speed" && (
        <>
          {heading("Speed Control", "Slow down or speed up a moment")}
          <div className="effects-root">
            {[
              ["Slow motion", "Slow a moment down so nobody misses it", "🐢"],
              ["Speed up", "Fast-forward a slow stretch to keep the clip moving", "🐇"],
            ].map(([name, sub, face]) => (
              <button
                className="effects-root-card effects-speed-card"
                key={name}
                onClick={() => {
                  if (!premium.require("speed-control")) return;
                  setPage("slow");
                  setSpeed(name === "Slow motion" ? "0.5×" : "2×");
                  actions.pushPage({
                    type: "detail",
                    title: name,
                    category: "Speed Control",
                  });
                  actions.addItem({
                    label: name === "Slow motion" ? "0.5×" : "2×",
                    kind: "effect",
                    category: "Speed Control",
                    speed: name === "Slow motion" ? 0.5 : 2,
                    start: fxStart(state, 3, Math.max(0, state.playhead)),
                    duration: 3,
                  });
                }}
              >
                {icon(face)}
                <span>
                  <strong>{name}</strong>
                  <small>{sub}</small>
                </span>
                <b>
                  <Icon name="plus" size={16} />
                </b>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
