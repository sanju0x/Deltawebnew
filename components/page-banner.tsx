import type { ReactNode } from "react";

type PageBannerProps = {
  icon: ReactNode;
  title: string;
  description: string;
  eyebrow?: string;
  id?: string;
};

export function PageBanner({ icon, title, description, eyebrow, id }: PageBannerProps) {
  return (
    <header className="page-banner">
      <span aria-hidden="true" className="banner-icon">{icon}</span>
      <div className="banner-copy">
        {eyebrow && <p className="banner-label">{eyebrow}</p>}
        <h1 id={id}>{title}</h1>
        <p className="banner-description">{description}</p>
      </div>
    </header>
  );
}
