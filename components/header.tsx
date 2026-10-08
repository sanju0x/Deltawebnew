"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Handshake, Menu, Users, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/commands", label: "Commands" },
  { href: "/premium", label: "Premium" },
  { href: "/bugreport", label: "Bug Report" },
  { href: "/status", label: "Status" },
  { href: "/updates", label: "Updates" },
  { href: "/support", label: "Support" },
];

const otherLinks = [
  { href: "/team", label: "Team", description: "Meet the people behind Delta", icon: Users },
  { href: "/partners", label: "Partners", description: "Explore our trusted partners", icon: Handshake },
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
            <DropdownMenu>
              <DropdownMenuTrigger className="group inline-flex min-h-11 items-center gap-1 rounded-lg px-1 outline-none focus-visible:ring-2 focus-visible:ring-[#d83229]/40 data-[state=open]:text-[#d82d25]">
                Other
                <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-64 rounded-2xl border-[#41342b]/15 bg-[#faf4eb]/98 p-2 shadow-xl shadow-[#362618]/10 backdrop-blur-xl"
              >
                {otherLinks.map(({ href, label, description, icon: Icon }) => (
                  <DropdownMenuItem key={href} asChild className="cursor-pointer rounded-xl p-0 focus:bg-[#efe4d5]">
                    <Link href={href} className="flex min-h-14 items-center gap-3 px-3 py-2.5 outline-none">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#d83229] shadow-sm">
                        <Icon className="size-4.5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-[#241f1b]">{label}</span>
                        <span className="mt-0.5 block text-xs font-medium text-[#746a61]">{description}</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
            <details className="group rounded-xl">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-xl px-4 py-3 font-bold text-[#332d28] marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d83229]/40">
                Other
                <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="mb-2 ml-3 grid gap-1 border-l border-[#41342b]/15 pl-2">
                {otherLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3"
                  >
                    <Icon className="size-4 text-[#d83229]" aria-hidden="true" />
                    {label}
                  </Link>
                ))}
              </div>
            </details>
            <a href={inviteUrl}>Add to Discord</a>
          </nav>
        )}
      </div>
    </header>
  );
}
