"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AudioLines,
  Check,
  Crown,
  Gauge,
  Headphones,
  ListMusic,
  RadioTower,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "/support";

const features = [
  {
    icon: AudioLines,
    title: "High-fidelity audio",
    description: "Clean playback that makes every room sound better.",
  },
  {
    icon: ListMusic,
    title: "Unlimited queues",
    description: "Keep the shared soundtrack moving for as long as you want.",
  },
  {
    icon: RadioTower,
    title: "24/7 rooms",
    description: "Leave Delta playing while your community works, chats, or sleeps.",
  },
  {
    icon: SlidersHorizontal,
    title: "Audio effects",
    description: "Shape the room with filters, bass boost, and custom presets.",
  },
  {
    icon: Gauge,
    title: "Fast commands",
    description: "Responsive controls with no confusing setup flow.",
  },
  {
    icon: UsersRound,
    title: "Community controls",
    description: "DJ roles and simple permissions keep shared listening fair.",
  },
];

export default function PremiumPage() {
  return (
    <main className="premium-page">
      <Header />

      <section className="premium-hero">
        <div className="site-container premium-hero-grid">
          <div className="premium-copy premium-reveal">
            <span className="section-kicker">
              <Crown className="size-4" />
              Delta Premium
            </span>
            <h1>
              Premium is not a
              <span>paywall.</span>
            </h1>
            <p>
              Delta is the premium bot because every server gets the full
              experience. No tiers, no trials, no subscription fatigue.
            </p>
            <div className="premium-actions">
              <a className="button-primary" href={inviteUrl}>
                Add Delta for free
                <Sparkles className="size-5" />
              </a>
              <Link className="button-secondary" href="/commands">
                See what Delta can do
              </Link>
            </div>
            <div className="premium-free-proof">
              <span><Check className="size-4" /> Free for every user</span>
              <span><Check className="size-4" /> Every feature included</span>
            </div>
          </div>

          <div className="premium-art premium-reveal premium-reveal-delay">
            <div className="premium-spark spark-one" aria-hidden="true" />
            <div className="premium-spark spark-two" aria-hidden="true" />
            <div className="premium-art-card">
              <div className="premium-art-topline">
                <span>FULL ACCESS</span>
                <ShieldCheck className="size-5" />
              </div>
              <div className="premium-art-logo">
                <Image src="/icon.svg" alt="Delta" width={190} height={190} priority />
              </div>
              <div className="premium-art-title">
                <strong>Delta</strong>
                <span>premium by default</span>
              </div>
              <div className="premium-art-wave" aria-hidden="true">
                {Array.from({ length: 18 }).map((_, index) => (
                  <i key={index} style={{ animationDelay: `${index * -70}ms` }} />
                ))}
              </div>
            </div>
            <div className="premium-sticker">
              <Headphones className="size-4" />
              ALL INCLUDED
            </div>
          </div>
        </div>
      </section>

      <section className="section-space premium-features">
        <div className="site-container">
          <div className="section-heading premium-section-heading">
            <span className="section-kicker">The whole thing</span>
            <h2>Nothing important is locked away.</h2>
            <p>
              We would rather have more people making great rooms than more
              complicated pricing tables.
            </p>
          </div>

          <div className="premium-feature-grid">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="premium-feature-card premium-reveal"
                style={{ animationDelay: `${index * 70 + 120}ms` }}
              >
                <div className="premium-feature-icon">
                  <feature.icon className="size-6" />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>

          <div className="premium-banner premium-reveal">
            <div>
              <span className="section-kicker section-kicker-light">One simple promise</span>
              <h2>Premium quality. Free access.</h2>
            </div>
            <div className="premium-banner-checks">
              <span><Check className="size-4" /> No subscription</span>
              <span><Check className="size-4" /> No feature tiers</span>
              <span><Check className="size-4" /> No hidden limits</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
