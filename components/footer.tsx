import Link from "next/link";
import Image from "next/image";

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
        <Link href="/" aria-label="Delta home" className="footer-banner" dir="ltr">
          <Image src="/icon.svg" alt="" width={56} height={56} />
          <span>
            <strong>Delta Music</strong>
            <span>Make the room sound better.</span>
          </span>
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
