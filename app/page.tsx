import { AudioLines } from "lucide-react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { StatsSection } from "@/components/stats-section";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";
import { LoadingScreen } from "@/components/loading-screen";

import { trialClaimsEnabled } from "@/lib/trials";

export const dynamic = "force-dynamic";
export default async function Home() {
  const claimsEnabled = await trialClaimsEnabled();
  return (
    <>
      <LoadingScreen />
      <main id="main-content" className="min-h-screen overflow-hidden">
        <Header showTrial={claimsEnabled} />
        <HeroSection />
        {claimsEnabled && <section className="site-container py-12" aria-labelledby="trial-heading">
          <div className="trial-offer home-trial-banner">
            <span className="banner-icon" aria-hidden="true"><AudioLines /></span>
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#d83229]">Free for 1 month</p>
              <h2 id="trial-heading" className="text-3xl font-bold">No prefix. Just play.</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">Claim 30 days of no-prefix commands. One free trial per Discord account. No payment required.</p>
            </div>
            <a className="button-primary shrink-0" href="/trial">View your free trial</a>
          </div>
        </section>}
        <FeaturesSection />
        <StatsSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
