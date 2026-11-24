import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Command, Headphones, Play } from "lucide-react";

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "/support";

export function HeroSection() {
  return (
    <section className="liquid-hero">
      <div className="liquid-ambient liquid-ambient-one" aria-hidden="true" />
      <div className="liquid-ambient liquid-ambient-two" aria-hidden="true" />
      <div className="site-container liquid-hero-layout">
        <div className="liquid-hero-copy">
          <h1>YOUR SERVER.<span>YOUR SOUND.</span></h1>
          <p>Meet Delta — the soundtrack to better conversations. Queue the next track, discover new favorites, and make every Discord night unforgettable.</p>
          <div className="hero-actions">
            <a className="button-primary" href={inviteUrl}><Play size={17} fill="currentColor" /> Add Delta <ArrowUpRight size={17} /></a>
            <Link className="button-secondary" href="/commands"><Command size={17} /> Explore commands</Link>
          </div>
          <div className="liquid-hero-proof">
            <span><Check size={15} /> Seamless setup</span>
            <span><Headphones size={15} /> High-quality audio</span>
            <span><Check size={15} /> Made for communities</span>
          </div>
        </div>
        <div className="liquid-hero-mark" aria-hidden="true">
          <div className="liquid-orbit liquid-orbit-outer" />
          <div className="liquid-orbit liquid-orbit-inner" />
          <Image
            src="/icon.svg"
            alt=""
            width={500}
            height={500}
            className="relative z-[2] h-auto w-3/5 max-w-80"
          />
          <div className="liquid-hero-stardust liquid-star-one" />
          <div className="liquid-hero-stardust liquid-star-two" />
        </div>
      </div>
      <div className="liquid-hero-bottom" aria-hidden="true" />
    </section>
  );
}
