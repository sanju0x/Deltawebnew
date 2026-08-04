"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const navLinks = [
  { href: "/commands", label: "Commands" },
  { href: "/premium", label: "Premium" },
  { href: "/bugreport", label: "Bug Report" },
  { href: "/status", label: "Status" },
  { href: "/updates", label: "Updates" },
  { href: "/support", label: "Support" },
];

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "/support";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-container">
        <div className="nav-shell">
          <Link href="/" aria-label="Delta home" className="brand-link">
            <BrandLogo compact />
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <a className="nav-cta" href={inviteUrl}>
            Add to Discord
          </a>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a href={inviteUrl}>Add to Discord</a>
          </nav>
        )}
      </div>
    </header>
  );
}
