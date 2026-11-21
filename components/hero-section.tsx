import Link from "next/link";
import { Check, Command, Play, Radio } from "lucide-react";
import { RubberLogo } from "@/components/rubber-logo";
import { RadioPreview } from "@/components/radio-preview";

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "/support";

export function HeroSection() {
  return (
    <section className="broadcast-hero">
      <div className="site-container broadcast-layout">
        <div className="broadcast-copy">
          <div className="broadcast-label"><Radio size={17} /> Discord music bot</div>
          <h1>Your server.<br /><em>Your soundtrack.</em></h1>
          <p>Turn your Discord room into a shared listening space with crisp audio, instant queues, and always-on radio.</p>
          <div className="hero-actions">
            <a className="button-primary" href={inviteUrl}><Play size={16} fill="currentColor" />Add to Discord</a>
            <Link className="button-secondary" href="/commands"><Command size={16} />Explore commands</Link>
          </div>
          <div className="broadcast-proof">
            {["Easy setup", "Always-on audio", "Free to start"].map(label => <span key={label}><Check size={14} />{label}</span>)}
          </div>
        </div>
        <div className="record-deck">
          <RubberLogo />
          <RadioPreview />
        </div>
      </div>
    </section>
  );
}
