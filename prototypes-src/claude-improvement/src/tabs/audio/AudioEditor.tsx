import { PanelHeader } from "../../shell/PanelHeader";
import { Icon } from "../../ui/Icon";
import type { AudioContext } from "./Audio";
import { hasVariant } from "../../variant";
import { AudioTiming } from "./variants/AudioTiming";
import { AudioVolumeQuick } from "./variants/AudioVolumeQuick";
export function AudioEditor({ c }: { c: AudioContext }) {
  const {
    state,
    actions,
    uploads,
    setUploads,
    library,
    setLibrary,
    filter,
    setFilter,
    search,
    setSearch,
    favorites,
    setFavorites,
    playing,
    setPlaying,
    trim,
    setTrim,
    previewStop,
    setPreviewStop,
    filterBar,
    selected,
    editing,
    volume,
    fadeIn,
    fadeOut,
    offset,
    loop,
    sounds,
    visible,
    add,
    play,
    change,
    fileChange,
    compact,
  } = c;
  if (!editing) return null;
  return (
    <>
      <button className="audio-back" onClick={() => actions.patch({ selectedElementId: null })}>
        ← &nbsp; Back to Audio
      </button>
      <PanelHeader title={editing.label} />
      <div className="audio-edit">
        {hasVariant("aud-timing") && <AudioTiming />}
        <h3>Volume</h3>
        <div className="audio-volume">
          <button
            aria-label="Mute"
            onClick={() => {
              const v = volume ? 0 : 100;
              change({ volume: v });
            }}
          >
            {volume ? <Icon name="volume" size={20} /> : <Icon name="volume-off" size={20} />}
          </button>
          <div>
            <input
              aria-label="Volume"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const v = +e.target.value;
                change({ volume: v });
              }}
            />
            <output>{volume}%</output>
          </div>
        </div>
        {hasVariant("aud-volume-quick") && <AudioVolumeQuick volume={volume} change={change} />}
        <label className="audio-fade">
          <span>♬ &nbsp; Fade Audio In</span>
          <input type="checkbox" aria-label="Fade Audio In" checked={fadeIn > 0} onChange={e => change({ fadeIn: e.target.checked ? 1 : 0 })} /><i />
        </label>
        <label className="audio-fade">
          <span>♬ &nbsp; Fade Audio Out</span>
          <input type="checkbox" aria-label="Fade Audio Out" checked={fadeOut > 0} onChange={e => change({ fadeOut: e.target.checked ? 1 : 0 })} /><i />
        </label>
        {fadeIn > 0 && <label className="audio-fade-controls">Fade in duration <input aria-label="Fade in duration" type="range" min=".1" max="5" step=".1" value={fadeIn} onChange={e=>change({fadeIn:+e.target.value})}/><output>{fadeIn.toFixed(1)}s</output></label>}
        {fadeOut > 0 && <label className="audio-fade-controls">Fade out duration <input aria-label="Fade out duration" type="range" min=".1" max="5" step=".1" value={fadeOut} onChange={e=>change({fadeOut:+e.target.value})}/><output>{fadeOut.toFixed(1)}s</output></label>}
        <button className={"audio-trim " + (trim ? "selected" : "")} onClick={() => setTrim(!trim)}>
          <span>
            <Icon name="scissors" size={20} />
          </span>
          <span>
            <strong>{hasVariant("aud-timing") ? "Skip the start of the song" : "Trim audio"}</strong>
            <small>{hasVariant("aud-timing") ? "Skip the first seconds of the song" : "Cut the beginning of your audio clip"}</small>
          </span>
        </button>
        {trim && (
          <div className="audio-trim-controls">
            <input
              aria-label={hasVariant("aud-timing") ? "Skip the start of the song" : "Trim audio"}
              type="range"
              min="0"
              max={Math.max(0, editing.duration + (editing.offset ?? 0) - 0.1)}
              step=".1"
              value={offset}
              onChange={(e) => {
                const v = +e.target.value;
                change({
                  offset: v,
                  duration: Math.max(0.1, editing.duration + (editing.offset ?? 0) - v),
                });
              }}
            />
            <span>Start &nbsp; {offset.toFixed(1)}s</span>
          </div>
        )}
      </div>
    </>
  );
}
