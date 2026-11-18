"use client";

import Image from "next/image";
import { Pause, Play, Radio, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";

function clock(seconds: number) {
  return Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
}

export function RadioPreview() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  async function togglePlayback() {
    const player = audio.current;
    if (!player) return;
    if (!player.paused) return player.pause();
    try {
      setFailed(false);
      await player.play();
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="radio-deck" aria-label="Delta Radio preview">
      <audio ref={audio} src="/radio/midnight-drive.mp3" preload="metadata" muted={muted}
        onLoadedMetadata={event => setDuration(event.currentTarget.duration)}
        onTimeUpdate={event => setElapsed(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)} />
      <Image src="/radio/midnight-drive.webp" width={52} height={52} alt="" className="radio-cover" />
      <div className="radio-track">
        <small><Radio size={12} /> Delta Radio</small>
        <strong>Midnight Drive</strong>
        {failed && <span role="status">Preview unavailable</span>}
      </div>
      <button className="radio-play" onClick={togglePlayback} aria-label={playing ? "Pause preview" : "Play preview"}>
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="radio-timeline">
        <time>{clock(elapsed)}</time>
        <input type="range" aria-label="Seek preview" min={0} max={duration || 1} step={0.1} value={elapsed}
          disabled={!duration} onChange={event => { if (audio.current) audio.current.currentTime = Number(event.target.value); }} />
        <time>{clock(duration)}</time>
      </div>
      <button className="radio-volume" onClick={() => setMuted(!muted)} aria-label={muted ? "Unmute preview" : "Mute preview"}>
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}
