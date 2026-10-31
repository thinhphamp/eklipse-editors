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
export function EffectsSlow({ c }: { c: EffectsContext }) {
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
      {page === "slow" && (
        <>
          {heading(
            speed === "2×" ? "Speed up" : "Slow motion",
            speed === "2×" ? "Choose how fast this moment plays" : "Choose how slow this moment plays",
            "Speed Control",
          )}
          <div className="effects-box">
            <h3>Speed</h3>
            <div className="effects-speed-options">
              {(speed === "2×"
                ? ["1.25×", "1.5×", "2×", "3×", "Custom"]
                : ["0.25×", "0.5×", "0.75×", "1×", "Custom"]
              ).map((v) => (
                <button
                  className={speed === v ? "selected" : ""}
                  key={v}
                  onClick={() => {
                    setSpeed(v);
                    const item =
                      state.effects.find(
                        (x) => x.id === state.selectedElementId && x.category === "Speed Control",
                      ) || state.effects.filter((x) => x.category === "Speed Control").at(-1);
                    if (item)
                      actions.updateItem(item.id, {
                        label: v,
                        speed: v === "Custom" ? 1 : Number(v.replace("×", "")),
                      });
                    if (speed === v) actions.notify("Speed set to " + v);
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            {speed === "Custom" && (
              <label className="effects-custom-speed">
                <span>Custom speed</span>
                <b>{(activeEffect?.speed || 1).toFixed(1)}×</b>
                <input
                  aria-label="Custom speed"
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={activeEffect?.speed || 1}
                  onChange={(e) => {
                    const item = state.effects.find(
                      (x) => x.id === state.selectedElementId && x.category === "Speed Control",
                    );
                    if (item)
                      actions.updateItem(item.id, {
                        speed: +e.target.value,
                        label: `${e.target.value}×`,
                      });
                  }}
                />
              </label>
            )}
            <p>Drag the block on the timeline to change which moment plays in slow motion.</p>
          </div>
          <div className="effects-box">
            <h3>Sound effect</h3>
            <button className="effects-sound-add" onClick={() => actions.chooseTab("Audio")}>
              {icon("volume")}
              <span>
                <strong>Add a sound effect</strong>
                <small>A dramatic hit that sells the slow motion.</small>
              </span>
              <b>Add ›</b>
            </button>
            <div className="effects-mute">
              <span>Mute clip audio during effect</span>
              <ToggleRow label="" value={muteClip} onChange={setMuteClip} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
