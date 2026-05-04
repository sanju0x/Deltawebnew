"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Users, Headphones, Terminal, Bug, Handshake, Crown, Activity, Sparkles } from "lucide-react";

const navLinks = [
  { href: "/team", label: "Team", icon: Users },
  { href: "/support", label: "Support", icon: Headphones },
  { href: "/commands", label: "Commands", icon: Terminal },
  { href: "/bugreport", label: "Bug Report", icon: Bug },
  { href: "/partners", label: "Partners", icon: Handshake },
  { href: "/premium", label: "Premium", icon: Crown },
  { href: "/status", label: "Status", icon: Activity },
  { href: "/updates", label: "Updates", icon: Sparkles },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between rounded-[2rem] bg-card/80 backdrop-blur-xl border border-border px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <svg
                className="h-6 w-6 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">Delta</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <link.icon className="h-4 w-4 group-hover:text-primary transition-colors" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center">
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6">
              Add to Discord
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground rounded-full hover:bg-secondary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-2 rounded-[2rem] bg-card/95 backdrop-blur-xl border border-border p-6 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors py-3 px-4 rounded-xl"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-border">
                <Button className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Add to Discord
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
