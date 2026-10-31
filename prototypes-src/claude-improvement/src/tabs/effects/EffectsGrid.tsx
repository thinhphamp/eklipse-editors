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
export function EffectsGrid({ c }: { c: EffectsContext }) {
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
      {page === "grid" && (
        <>
          {heading("Effects", "Add effects to your video")}
          <TileGrid columns={4} className="effects-grid">
            {shaderPresets.map((preset, i) => (
              <button
                key={preset.name}
                className={"effects-effect-tile " + (selectedEffect === preset.name ? "selected" : "")}
                onClick={() => {
                  if (!premium.require("shader-effects")) return;
                  setSelectedEffect(preset.name);
                  addEffect(preset.name, "Effects", {
                    shader: preset.name,
                    duration: preset.durationMs / 1000,
                  });
                }}
              >
                <span className={"effects-art effects-art-" + i}>
                  {art[i]}
                  {preset.name === "Screen Shake" && <b>New</b>}
                </span>
                <span>{preset.name}</span>
              </button>
            ))}
          </TileGrid>
        </>
      )}
    </>
  );
}
