import Link from "next/link";
import { ArrowRight, Check, Music2, Play, Radio, Sparkles } from "lucide-react";
import { RubberLogo } from "@/components/rubber-logo";

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "/support";

export function HeroSection() {
  return (
    <section className="hero-shell">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-orb hero-orb-one" aria-hidden="true" />
      <div className="hero-orb hero-orb-two" aria-hidden="true" />

      <div className="site-container hero-layout">
        <div className="hero-copy">
          <h1 className="hero-title reveal-one">
            Your server.
            <span>Your soundtrack.</span>
          </h1>

          <p className="hero-description reveal-two">
            Delta turns every Discord room into a shared listening space with
            crisp audio, instant queues, and controls that never interrupt the
            conversation.
          </p>

          <div className="hero-actions reveal-three">
            <a className="button-primary" href={inviteUrl}>
              <Play className="size-5" fill="currentColor" />
              Add Delta
              <ArrowRight className="size-4" />
            </a>
            <Link className="button-secondary" href="/commands">
              Explore commands
            </Link>
          </div>

          <div className="hero-proof reveal-four" aria-label="Delta highlights">
            <span><Check className="size-4" /> No setup maze</span>
            <span><Check className="size-4" /> Always-on audio</span>
            <span><Check className="size-4" /> Free to start</span>
          </div>
        </div>

        <div className="hero-object reveal-three">
          <div className="hero-object-label">
            <Sparkles className="size-4" />
            Pull, stretch, release
          </div>
          <RubberLogo />
          <div className="now-playing-pill">
            <span className="playing-icon"><Music2 className="size-4" /></span>
            <span>
              <small>NOW PLAYING</small>
              Midnight Drive Radio
            </span>
            <span className="equalizer" aria-label="Audio playing">
              <i />
              <i />
              <i />
              <i />
            </span>
            <Radio className="size-4 text-[#f04b3f]" />
          </div>
        </div>
      </div>
    </section>
  );
}
