"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";

export function SuggestionPrompt() {
  const path = usePathname();
  const eligible = !path.startsWith("/admin") && path !== "/suggestions";
  const shown = useRef(false);
  const [phase, setPhase] = useState<"hidden" | "open" | "closing">("hidden");
  useEffect(() => {
    if (!eligible || shown.current) return;
    function reveal() {
      if (document.hidden || document.querySelector('[role="dialog"][data-state="open"], .loading-screen')) {
        timer = setTimeout(reveal, 500);
        return;
      }
      shown.current = true;
      setPhase("open");
    }
    let timer = setTimeout(reveal, 1400);
    return () => { clearTimeout(timer); setPhase("hidden"); };
  }, [eligible]);
  useEffect(() => {
    if (phase === "hidden") return;
    if (phase === "closing") {
      const timer = setTimeout(() => setPhase("hidden"), 280);
      return () => clearTimeout(timer);
    }
    const audio = new Audio("/suggestion-chime.wav");
    audio.volume = 0.3;
    let played = false;
    function play() {
      if (!played) void audio.play().then(() => { played = true; }).catch(() => {});
    }
    play();
    window.addEventListener("pointerdown", play);
    window.addEventListener("keydown", play);
    const timer = setTimeout(() => setPhase("closing"), 6000);
    return () => {
      clearTimeout(timer); audio.pause();
      window.removeEventListener("pointerdown", play);
      window.removeEventListener("keydown", play);
    };
  }, [phase]);
  if (!eligible || phase === "hidden") return null;
  return <aside aria-label="Suggestions" className="suggestion-position">
    <div className="suggestion-prompt" data-phase={phase}>
      <MessageSquarePlus aria-hidden size={24} />
      <div><strong>Any Suggestions</strong>
        <Link href="/suggestions" aria-label="Click Here to share a suggestion"><span>Click Here</span></Link></div>
      <button type="button" aria-label="Dismiss suggestion prompt" onClick={() => setPhase("closing")}><X size={17} /></button>
    </div>
  </aside>;
}
