import Link from "next/link";
import Image from "next/image";

const footerLinks = [
  { href: "/commands", label: "Commands" },
  { href: "/team", label: "Team" },
  { href: "/partners", label: "Partners" },
  { href: "/status", label: "Status" },
  { href: "/suggestions", label: "Suggestions" },
  { href: "/support", label: "Support" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-layout">
        <Link href="/" aria-label="Delta Music home" className="footer-banner">
          <span className="footer-emblem"><Image src="/icon.svg" alt="" width={52} height={52} /></span>
          <span><strong>Delta Music</strong><span className="footer-tagline">Make the room sound better.</span></span>
        </Link>

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
