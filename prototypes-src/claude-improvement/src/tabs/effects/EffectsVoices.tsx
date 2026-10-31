import { TileGrid } from '../../ui/TileGrid';
import { MockBadge, mockDelay } from '../../ui/MockBadge';
import { aiMocks } from '../../fixtures';
import { getEngine } from '../../engine/playback-engine';
import type { EffectsContext } from './Effects';
export function EffectsVoices({c}:{c:EffectsContext}){
 const { icon, actions, voices, voice, setVoice, voicePreview, premium, text, busy, setBusy, state, faces }=c;
 return (
    <div className="effects-tts-box">
      <div className="effects-feature-intro">
        {icon("tts")}
        <span>
          <strong>Text to speech</strong>
          <small>Turn your text into speech</small>
        </span>
      </div>
      <div className="effects-voice-heading">
        <strong>Voices</strong>
        <button onClick={() => actions.notify("All voices shown")}>View all</button>
      </div>
      <TileGrid columns={3} className="effects-voice-grid">
        {voices.map((v, i) => (
          <button
            className={"effects-voice " + (voice === v ? "selected" : "")}
            key={v}
            onClick={() => {
              setVoice(v);
              voicePreview.current?.();
              const asset = aiMocks.ttsVoices.find((x) => x.name === v) || aiMocks.ttsVoices[i % aiMocks.ttsVoices.length];
              if (asset) voicePreview.current = getEngine().mixer.preview(asset.file, 0.8);
              actions.notify("Playing " + v + " voice sample");
            }}
          >
            <span>{faces[i]}</span>
            <strong>{v}</strong>
          </button>
        ))}
      </TileGrid>
      <MockBadge />
      <button
        className="effects-primary"
        disabled={busy}
        onClick={async () => {
          if (!text.trim() || !premium.require("text-to-speech")) return;
          setBusy(true);
          await mockDelay();
          const chosen = aiMocks.ttsVoices.find((x) => x.name === voice) || aiMocks.ttsVoices[Math.max(0, voices.indexOf(voice)) % aiMocks.ttsVoices.length];
          actions.addItem({
            label: text.trim().replace(/\s+/g, " "),
            kind: "audio",
            category: "Text to speech",
            media: chosen.file,
            start: Math.max(0, state.playhead),
            duration: Math.max(1.5, Math.min(30, text.trim().split(/\s+/).length * 0.46)),
            loop: true,
            volume: 100,
          });
          setBusy(false);
          actions.chooseTab("Audio");
          actions.pushPage({
            type: "edit",
            title: text.trim().replace(/\s+/g, " "),
            category: "Text to speech",
          });
        }}
      >
        {busy ? "Generating…" : "Generate speech"}
      </button>
    </div>
  );
}
