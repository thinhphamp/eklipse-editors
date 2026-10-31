import './audio-variants.css';

// Variant aud-volume-quick: the volume as a number plus one button that sets a voice-friendly level.
export const UNDER_VOICE = 25;

export function AudioVolumeQuick({ volume, change }: { volume: number; change: (patch: Record<string, unknown>) => void }) {
  return <div className="aud-volume-quick">
    <span>Volume <b>{volume}%</b></span>
    <button type="button" disabled={volume === UNDER_VOICE} onClick={() => change({ volume: UNDER_VOICE })}>Lower under voice ({UNDER_VOICE}%)</button>
  </div>;
}
