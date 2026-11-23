"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Handshake, Menu, MessageSquarePlus, Sparkles, Users, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardAccountMenu } from "@/components/dashboard-account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
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
  { href: "/suggestions", label: "Suggestions", description: "Share an idea for Delta", icon: MessageSquarePlus },
  { href: "/trial", label: "No-Prefix Trial", description: "Claim your free month with Discord", icon: Sparkles },
  { href: "/team", label: "Team", description: "Meet the people behind Delta", icon: Users },
  { href: "/partners", label: "Partners", description: "Explore our trusted partners", icon: Handshake },
];

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "/support";

export function Header({ showTrial }: { showTrial?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (showTrial !== undefined) return;
    const controller = new AbortController();
    fetch("/api/trial/availability", { cache: "no-store", signal: controller.signal })
      .then(response => response.json()).then(data => { if (!controller.signal.aborted) setEnabled(data.enabled === true); })
      .catch(() => {});
    return () => controller.abort();
  }, [showTrial]);
  const menuLinks = otherLinks.filter(link => (showTrial ?? enabled) || link.href !== "/trial");
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const compact = window.matchMedia("(max-width: 1150px)");
    function onResize() {
      if (!compact.matches) setIsMenuOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setIsMenuOpen(false);
        toggleRef.current?.focus();
      }
    }
    compact.addEventListener("change", onResize);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      compact.removeEventListener("change", onResize);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header ref={headerRef} className={isLanding ? "site-header liquid-site-header" : "site-header"}>
      <div className="site-container">
        <div className="nav-shell">
          <Link href="/" aria-label="Delta home" className="brand-link">
            <BrandLogo compact />
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
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
                className={isLanding ? "w-64 rounded-2xl border-white/20 bg-[#21151c]/90 p-2 text-white shadow-2xl backdrop-blur-2xl" : "w-64 rounded-2xl border-[#41342b]/15 bg-[#faf4eb]/98 p-2 shadow-xl shadow-[#362618]/10 backdrop-blur-xl"}
              >
                {menuLinks.map(({ href, label, description, icon: Icon }) => (
                  <DropdownMenuItem key={href} asChild className={isLanding ? "cursor-pointer rounded-xl p-0 focus:bg-white/10" : "cursor-pointer rounded-xl p-0 focus:bg-[#efe4d5]"}>
                    <Link href={href} className="flex min-h-14 items-center gap-3 px-3 py-2.5 outline-none">
                      <span className={isLanding ? "grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-red-300 shadow-sm" : "grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#d83229] shadow-sm"}>
                        <Icon className="size-4.5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className={isLanding ? "block text-sm font-bold text-white" : "block text-sm font-bold text-[#241f1b]"}>{label}</span>
                        <span className={isLanding ? "mt-0.5 block text-xs font-medium text-white/60" : "mt-0.5 block text-xs font-medium text-[#746a61]"}>{description}</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="header-theme-toggle">
            <ThemeToggle />
          </div>

          <DashboardAccountMenu />

          <a className="nav-cta" href={inviteUrl}>
            Add to Discord
          </a>

          <button
            type="button"
            ref={toggleRef}
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
                aria-current={pathname === link.href ? "page" : undefined}
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
                {menuLinks.map(({ href, label, icon: Icon }) => (
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
            <a href={inviteUrl} onClick={() => setIsMenuOpen(false)}>Add to Discord</a>
          </nav>
        )}
      </div>
    </header>
  );
}

