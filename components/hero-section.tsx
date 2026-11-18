import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, AudioLines, Check, Terminal } from "lucide-react";
import { RadioPreview } from "@/components/radio-preview";

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "/support";

export function HeroSection() {
  return (
    <section className="broadcast" aria-labelledby="broadcast-title">
      <Image className="broadcast-art" src="/radio/midnight-drive.webp" alt="" fill priority sizes="100vw" />
      <div className="site-container broadcast-inner">
        <div className="broadcast-copy">
          <p className="broadcast-kicker"><AudioLines size={17} /> Discord music bot</p>
          <h1 id="broadcast-title">Your server.<br /><em>Your soundtrack.</em></h1>
          <p className="broadcast-description">Turn your Discord room into a shared listening space with crisp audio, instant queues, and always-on radio.</p>
          <div className="broadcast-actions">
            <a className="button-primary" href={inviteUrl}>Add to Discord <ArrowUpRight size={17} /></a>
            <Link className="button-secondary" href="/commands"><Terminal size={16} /> Explore commands</Link>
          </div>
          <div className="broadcast-proof">
            {["No setup maze", "Always-on audio", "Free to start"].map(label => <span key={label}><Check size={13} />{label}</span>)}
          </div>
        </div>
        <RadioPreview />
      </div>
    </section>
  );
}
