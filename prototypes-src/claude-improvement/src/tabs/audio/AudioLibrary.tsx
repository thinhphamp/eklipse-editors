import { soundCategories } from "../../data";
import { PanelHeader } from "../../shell/PanelHeader";
import { Icon } from "../../ui/Icon";
import type { AudioContext } from "./Audio";
import { hasVariant } from "../../variant";
import { GameSound } from "./variants/GameSound";
export function AudioLibrary({ c }: { c: AudioContext }) {
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
  return (
    <>
      <PanelHeader
        title="Audio"
        subtitle="Add sound effects and music to your video to keep your audience engaged."
      />
      {hasVariant("aud-game-sound") && <GameSound />}
      <div className="audio-tabs">
        <button
          className={library === "Sound Effects" ? "selected" : ""}
          onClick={() => {
            setLibrary("Sound Effects");
            setFilter("All");
            setSearch("");
            actions.notify("Showing sound effects");
          }}
        >
          <Icon name="volume" size={15} /> Sound Effects
        </button>
        <button
          className={library === "Music" ? "selected" : ""}
          onClick={() => {
            setLibrary("Music");
            setFilter("All");
            setSearch("");
            actions.notify("Showing music");
          }}
        >
          <Icon name="audio" size={15} /> Music
        </button>
      </div>
      <label className="audio-search">
        <Icon name="search" size={16} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={library === "Music" ? "Search music" : "Search sound effects"}
          placeholder={library === "Music" ? "Search music" : "Search for sound effects"}
        />
      </label>
      {library === "Sound Effects" && (
        <div className="audio-filters" ref={filterBar}>
          {["All", "Uploaded", "Favorites", ...soundCategories].map((v) => (
            <button
              className={filter === v ? "selected" : ""}
              key={v}
              onClick={() => {
                setFilter(v);
                if (v === "All") actions.notify("Showing all sound effects");
              }}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      <label className="audio-upload">
        <input type="file" accept="audio/*" onChange={(e) => fileChange(e.target.files?.[0])} />
        <span className="audio-upload-icon"><Icon name="upload" size={16} /></span>
        <strong>Upload your own audio</strong>
        <small>Audio files up to 5 MB</small>
      </label>
      {(library === "Music" ? [{ name: "Songs", items: visible }] : filter === "All" && !search ? soundCategories.map(name => ({ name, items: visible.filter(item => item.category === name).slice(0, 3) })) : [{ name: filter === "All" ? "Sound effects" : filter, items: visible }]).map(group => <section className="audio-group" key={group.name}>
        <div className="audio-group-heading"><h3>{group.name}</h3>{library === "Sound Effects" && filter === "All" && !search && <button onClick={() => setFilter(group.name)}>View all</button>}</div>
        {group.items.map((item) => (
          <div className="audio-row" key={item.path}>
            <button className="audio-play" title={"Play " + item.name} onClick={() => play(item)}>
              {playing === item.name ? <Icon name="pause" size={18} /> : <Icon name="play" size={18} />}
            </button>
            <button className="audio-row-title" onClick={() => add(item)}>
              <strong>{item.name}</strong>
              <small>{item.category === "Music" ? "Full songs" : item.category}</small>
            </button>
            <span className="audio-duration">{item.duration}</span>
            <div className="audio-row-actions">
              <button
                title={"Favorite " + item.name}
                onClick={() =>
                  setFavorites(
                    favorites.includes(item.name)
                      ? favorites.filter((v) => v !== item.name)
                      : [...favorites, item.name],
                  )
                }
              >
                {favorites.includes(item.name) ? "♥" : "♡"}
              </button>
              <button title={"Add " + item.name} aria-label={"Add " + item.name} onClick={() => add(item)}>
                <Icon name="plus" size={15} />
              </button>
            </div>
          </div>
        ))}
        {!group.items.length && filter !== "All" && <p className="audio-no-results">No results found</p>}
      </section>)}
    </>
  );
}
