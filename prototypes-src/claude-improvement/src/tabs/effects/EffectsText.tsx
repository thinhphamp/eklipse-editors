import { EffectsVoices } from './EffectsVoices';
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
export function EffectsText({ c }: { c: EffectsContext }) {
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
      {(page === "tts" || page === "hook") && (
        <>
          {heading("Edit text element", "Change the text and style of your text element.", "Elements")}
          <div className="effects-edit-tabs">
            {["Edit", "Style", "Animations", "Sound", "Presets"].map((v, i) => (
              <button
                key={v}
                className={editTab === v ? "selected" : ""}
                onClick={() => {
                  setEditTab(v);
                  if (editTab === v) actions.notify(v + " tab selected");
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <label className="effects-text-label">
            Text
            <textarea value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          {page === "hook" && (
            <>
              <MockBadge />
            </>
          )}
          {(page === "tts" || page === "hook") && <EffectsVoices c={c} />}
        </>
      )}
    </>
  );
}
