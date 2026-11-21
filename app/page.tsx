import { ArrowUpRight, Ticket } from "lucide-react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { StatsSection } from "@/components/stats-section";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";
import { LoadingScreen } from "@/components/loading-screen";

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <main id="main-content" className="min-h-screen overflow-hidden">
        <Header />
        <HeroSection />
        <section className="site-container trial-strip" aria-labelledby="trial-heading">
          <div className="trial-panel">
            <Ticket className="trial-icon" aria-hidden="true" />
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">No-prefix trial</p>
              <h2 id="trial-heading" className="text-3xl font-bold">No prefix. Just play.</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">Claim 30 days of no-prefix commands. One free trial per Discord account. No payment required.</p>
            </div>
            <a className="button-primary shrink-0" href="/api/trial/login">Claim free trial <ArrowUpRight size={16} /></a>
          </div>
        </section>
        <FeaturesSection />
        <StatsSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
