import type { LucideIcon } from "lucide-react";

type PageBannerProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  headingId?: string;
};

export function PageBanner({ icon: Icon, title, description, headingId }: PageBannerProps) {
  return (
    <header className="page-banner">
      <span className="banner-icon" aria-hidden="true"><Icon /></span>
      <div className="banner-copy">
        <h1 id={headingId}>{title}</h1>
        <p>{description}</p>
      </div>
      <Icon className="banner-imprint" aria-hidden="true" strokeWidth={0.8} />
    </header>
  );
}
