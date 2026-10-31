import { assetUrl } from "../../engine/asset-url";
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
export function EffectsZoom({ c }: { c: EffectsContext }) {
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
      {page === "zoom" && (
        <>
          {heading("Choose where to zoom", "Drag the box below around to choose where you want to zoom in your video.")}
          <div className="effects-zoom-source" style={{ backgroundImage: `url(${assetUrl("media/demo-poster.jpg")})` }}>
            <div
              className="effects-zoom-window"
              title="Drag to choose zoom area"
              style={{
                left: `${focus.x * 100 - 12}%`,
                top: `${focus.y * 100 - 12}%`,
              }}
              onClick={() => {
                const next = {
                  x: focus.x > 0.5 ? 0.3 : 0.7,
                  y: focus.y > 0.5 ? 0.3 : 0.7,
                };
                setFocus(next);
                if (activeEffect)
                  actions.updateItem(activeEffect.id, {
                    zoom: 1 + zoomLevel / 100,
                    focus: next,
                  });
              }}
              onPointerDown={(e) => {
                setDragging(true);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!dragging) return;
                const r = e.currentTarget.parentElement!.getBoundingClientRect();
                setFocus({
                  x: Math.max(0.12, Math.min(0.88, (e.clientX - r.left) / r.width)),
                  y: Math.max(0.12, Math.min(0.88, (e.clientY - r.top) / r.height)),
                });
              }}
              onPointerUp={() => {
                setDragging(false);
                if (activeEffect)
                  actions.updateItem(activeEffect.id, {
                    zoom: 1 + zoomLevel / 100,
                    focus,
                  });
              }}
            />
          </div>
          <div className="effects-divider" />
          <div className="effects-field">
            <h3>
              <b className="effects-new">NEW</b> Zoom animation
            </h3>
            <p>Choose an animation style for the zoom effect.</p>
            <button className="effects-select" onClick={() => setAnimationOpen(!animationOpen)}>
              {animation}
              <span>⌄</span>
            </button>
            {animationOpen && (
              <div className="effects-dropdown">
                {["None", "Zoom in", "Zoom out"].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setAnimation(v);
                      setAnimationOpen(false);
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="effects-divider" />
          <div className="effects-field">
            <h3>Zoom level</h3>
            <p>How close to zoom during the zoom effect.</p>
            <div className="effects-zoom-slider">
              <button
                aria-label="Zoom out"
                onClick={() => {
                  const v = Math.max(0, zoomLevel - 10);
                  setZoomLevel(v);
                  if (activeEffect)
                    actions.updateItem(activeEffect.id, {
                      zoom: 1 + v / 100,
                      focus,
                    });
                }}
              >
                <Icon name="minus" size={14} />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={zoomLevel}
                onChange={(e) => {
                  const v = +e.target.value;
                  setZoomLevel(v);
                  if (activeEffect)
                    actions.updateItem(activeEffect.id, {
                      zoom: 1 + v / 100,
                      focus,
                    });
                }}
              />
              <button
                aria-label="Zoom in"
                onClick={() => {
                  const v = Math.min(100, zoomLevel + 10);
                  setZoomLevel(v);
                  if (activeEffect)
                    actions.updateItem(activeEffect.id, {
                      zoom: 1 + v / 100,
                      focus,
                    });
                }}
              >
                <Icon name="plus" size={14} />
              </button>
            </div>
          </div>
          <div className="effects-divider" />
          <div className="effects-saved-heading">
            <h3>Saved zooms</h3>
            <button aria-label="Save zoom" onClick={() => setSavedZooms(savedZooms + 1)}>
              <Icon name="plus" size={14} />
            </button>
          </div>
          {savedZooms ? (
            <div className="effects-saved-card">Saved zoom {savedZooms}</div>
          ) : (
            <div className="effects-empty">
              <span>⌕</span>
              <strong>No zooms saved yet</strong>
              <small>Save a zoom to get started</small>
              <button onClick={() => setSavedZooms(1)}>Save zoom</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
