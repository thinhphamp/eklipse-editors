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
export function EffectsSilence({ c }: { c: EffectsContext }) {
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
      {page === "silence" && (
        <>
          {heading("AI - Remove silences", "Remove silent moments from your clip")}
          <MockBadge />
          <p className="effects-silence-count">
            <b>{removed ? "0" : silenceRanges(sensitivity * 1000).length}</b> silences longer than{" "}
            <b>{sensitivity.toFixed(1)}s</b> found
          </p>
          <h3>Silence Sensitivity</h3>
          <p className="effects-silence-help">
            Choose how short a silence needs to be to stay in your clip. Smaller numbers cut out more little
            pauses.
          </p>
          <div className="effects-silence-slider">
            <input
              type="range"
              min="0.1"
              max="4"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(+e.target.value)}
            />
            <output>{sensitivity.toFixed(1)} &nbsp; s</output>
          </div>
          <button
            className="effects-primary"
            disabled={removed}
            onClick={() => {
              if (!premium.require("remove-silences")) return;
              const ranges = silenceRanges(sensitivity * 1000).map((r) => ({
                start: Math.max(0, r.startMs / 1000 - padding),
                end: Math.min(transcript.durationMs / 1000, r.endMs / 1000 + padding),
              }));
              const seconds = ranges.reduce((n, r) => n + r.end - r.start, 0);
              actions.commit(
                {
                  removedRanges: [
                    ...state.removedRanges,
                    ...ranges.map((r) => ({ ...r, source: "silence" })),
                  ],
                },
                "Remove silences",
              );
              setRemoved(true);
              actions.notify(`${seconds.toFixed(1)} seconds removed`);
            }}
          >
            Remove {removed ? "0" : "13"} silences
          </button>
          <button
            className="effects-reset"
            onClick={() => {
              setRemoved(false);
              actions.commit(
                {
                  removedRanges: state.removedRanges.filter(
                    (r) => !("source" in r && r.source === "silence"),
                  ),
                },
                "Reset silence removal",
              );
              if (!removed) actions.notify("No silence cuts to reset");
            }}
          >
            Reset effect <Icon name="undo" size={14} />
          </button>
        </>
      )}
    </>
  );
}
