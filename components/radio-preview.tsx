"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { renderRadioPreview } from "@/lib/radio-preview";

export function RadioPreview() {
  const audio = useRef<HTMLAudioElement>(null);
  const source = useRef("");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(false);
  useEffect(() => () => { if (source.current) URL.revokeObjectURL(source.current); }, []);

  async function togglePlayback() {
    const track = audio.current;
    if (!track) return;
    if (!track.paused) return track.pause();
    try {
      setError(false);
      if (!source.current) {
        source.current = renderRadioPreview();
        track.src = source.current;
      }
      await track.play();
    } catch {
      setError(true);
    }
  }

  return (
    <div className="radio-preview">
      <audio ref={audio} preload="none" muted={muted}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onTimeUpdate={event => setElapsed(event.currentTarget.currentTime)} />
      <button className="transport" onClick={togglePlayback} aria-label={playing ? "Pause Midnight Drive" : "Play Midnight Drive preview"}>
        {playing ? <Pause fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} />}
      </button>
      <div className="track-name"><small>{playing ? "Now playing" : "Audio preview"}</small><strong>Midnight Drive Radio</strong></div>
      <span className="track-time">0:{Math.floor(elapsed).toString().padStart(2, "0")} / 0:24</span>
      <button className="mute-control" onClick={() => setMuted(!muted)} aria-label={muted ? "Unmute preview" : "Mute preview"}>
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <progress value={elapsed} max={24} aria-label="Preview playback position" />
      {error && <small role="alert">Playback unavailable. Try again.</small>}
    </div>
  );
}
