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
      <main className="min-h-screen">
        <Header />
        <HeroSection />
        <FeaturesSection />
        
        <StatsSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
