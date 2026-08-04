import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "/support";

export function CTASection() {
  return (
    <section className="section-space">
      <div className="site-container">
        <div className="cta-panel">
          <div className="cta-logo" aria-hidden="true">
            <Image src="/icon.svg" alt="" width={160} height={160} />
          </div>
          <div className="cta-copy">
            <span className="section-kicker">Your next favorite room</span>
            <h2>Press play. Delta handles the rest.</h2>
            <p>
              Add Delta in seconds, invite your people, and turn any voice
              channel into the place everyone wants to stay.
            </p>
          </div>
          <div className="cta-actions">
            <a className="button-primary" href={inviteUrl}>
              Add to Discord
              <ArrowUpRight className="size-5" />
            </a>
            <Link className="button-secondary" href="/support">
              <MessageCircle className="size-5" />
              Get support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
