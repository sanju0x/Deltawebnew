import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const footerLinks = [
  { href: "/commands", label: "Commands" },
  { href: "/team", label: "Team" },
  { href: "/partners", label: "Partners" },
  { href: "/status", label: "Status" },
  { href: "/support", label: "Support" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-layout">
        <div>
          <Link href="/" aria-label="Delta home">
            <BrandLogo />
          </Link>
          <p className="footer-note">Make the room sound better.</p>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>

        <p className="footer-legal">
          © 2026 Delta. Not affiliated with Discord Inc.
        </p>
      </div>
    </footer>
  );
}
