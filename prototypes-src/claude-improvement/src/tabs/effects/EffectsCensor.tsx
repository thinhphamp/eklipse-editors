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
export function EffectsCensor({ c }: { c: EffectsContext }) {
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
      {page === "censor" && (
        <>
          {heading("AI - Word censoring", "Make your videos TikTok friendly.", "Elements")}
          <div className="effects-censor-switch">
            <ToggleRow label="" value={censorOn} onChange={setCensorOn} />
          </div>
          <div className="effects-info">ⓘ &nbsp; AI helps, but review for TikTok safety</div>
          <div className="effects-divider" />
          <div className="effects-field">
            <h3>Censor sound effect</h3>
            <button className="effects-censor-select" onClick={() => setSoundOpen(!soundOpen)}>
              <span>⊘</span>
              <strong>{sound}</strong>
              <b>⌄</b>
            </button>
            {soundOpen && (
              <div className="effects-censor-menu">
                {["Mute", "Censorship beep", "Dolphin click", "Duck quack", "Rubber duck squeak"].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setSound(v);
                      setSoundOpen(false);
                    }}
                  >
                    <span>{v === "Mute" ? "⊘" : "▶"}</span>
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="effects-divider" />
          <div className="effects-transcript">
            <MockBadge />
            <h3>Transcription</h3>
            <small>Click on the words to censor or un-censor them.</small>
            <button
              className="effects-primary"
              disabled={busy}
              onClick={async () => {
                if (!premium.require("filter-profanity")) return;
                setBusy(true);
                await mockDelay();
                const marked = [...new Set([...aiMocks.profanity.words, ...censored])];
                setCensored(marked);
                if (sound !== "Mute") {
                  const bleep = "media/sfx/alerts-notifications-short-pop.mp3";
                  marked.forEach((i) => {
                    const w = words[i];
                    if (w)
                      actions.addItem({
                        label: "Censor beep",
                        kind: "audio",
                        category: "Sound Effects",
                        media: bleep,
                        start: w.startMs / 1000,
                        duration: Math.max(0.3, (w.endMs - w.startMs) / 1000),
                        volume: 100,
                        style: { duckClip: true },
                      });
                  });
                }
                setBusy(false);
                actions.notify("Profanity marked; clip audio cannot be ducked per word");
              }}
            >
              Run censor
            </button>
            <p>
              {words.map((w, i) => (
                <button
                  key={i}
                  className={censored.includes(i) || aiMocks.profanity.words.includes(i) ? "censored" : ""}
                  onClick={() =>
                    setCensored(censored.includes(i) ? censored.filter((x) => x !== i) : [...censored, i])
                  }
                >
                  {w.text}{" "}
                </button>
              ))}
            </p>
          </div>
        </>
      )}
    </>
  );
}
