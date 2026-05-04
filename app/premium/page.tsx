"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Music, Clock, Headphones, Star, Shield } from "lucide-react";

const features = [
  {
    icon: Music,
    title: "Lossless Audio",
    description: "Experience music in the highest quality possible with lossless audio streaming.",
  },
  {
    icon: Clock,
    title: "24/7 Mode",
    description: "Keep Delta in your voice channel around the clock, even when not playing.",
  },
  {
    icon: Headphones,
    title: "Premium Effects",
    description: "Access exclusive audio effects like spatial audio, karaoke mode, and more.",
  },
  {
    icon: Zap,
    title: "Priority Queue",
    description: "Your commands get processed faster with priority server access.",
  },
  {
    icon: Star,
    title: "Unlimited Playlists",
    description: "Save unlimited playlists with up to 1000 tracks each.",
  },
  {
    icon: Shield,
    title: "Premium Support",
    description: "Get priority support from our team with faster response times.",
  },
];

const plans = [
  {
    name: "Monthly",
    price: "$4.99",
    period: "/month",
    description: "Perfect for trying out premium features",
    features: [
      "All premium features",
      "1 server activation",
      "Priority support",
      "Cancel anytime",
    ],
    popular: false,
  },
  {
    name: "Yearly",
    price: "$39.99",
    period: "/year",
    description: "Best value - Save 33%",
    features: [
      "All premium features",
      "3 server activations",
      "Priority support",
      "Exclusive badge",
      "Early access to new features",
    ],
    popular: true,
  },
  {
    name: "Lifetime",
    price: "$99.99",
    period: "one-time",
    description: "Pay once, enjoy forever",
    features: [
      "All premium features",
      "5 server activations",
      "VIP support",
      "Exclusive badge",
      "Early access to new features",
      "Custom bot status",
    ],
    popular: false,
  },
];

const comparisons = [
  { feature: "Audio Quality", free: "128kbps", premium: "Lossless" },
  { feature: "Queue Length", free: "50 tracks", premium: "Unlimited" },
  { feature: "Saved Playlists", free: "3", premium: "Unlimited" },
  { feature: "Audio Effects", free: "Basic", premium: "All Effects" },
  { feature: "24/7 Mode", free: "No", premium: "Yes" },
  { feature: "Custom Prefix", free: "No", premium: "Yes" },
  { feature: "Support", free: "Community", premium: "Priority" },
];

export default function PremiumPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-500 font-medium mb-6">
              <Crown className="h-5 w-5" />
              Delta Premium
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Upgrade Your <span className="text-primary">Music Experience</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock the full potential of Delta with premium features designed for the ultimate Discord music experience.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-3xl p-6 hover:border-primary/50 transition-all group"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">Choose Your Plan</h2>
            <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative bg-card border rounded-3xl p-8 transition-all ${
                    plan.popular
                      ? "border-primary shadow-lg shadow-primary/20 scale-105"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-foreground">
                        <Check className="h-5 w-5 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-full py-6 ${
                      plan.popular
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-secondary hover:bg-primary text-foreground hover:text-primary-foreground"
                    }`}
                  >
                    Get {plan.name}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">Free vs Premium</h2>
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="grid grid-cols-3 bg-secondary/50 p-4 font-semibold text-foreground">
                <span>Feature</span>
                <span className="text-center">Free</span>
                <span className="text-center text-primary">Premium</span>
              </div>
              {comparisons.map((item, index) => (
                <div
                  key={item.feature}
                  className={`grid grid-cols-3 p-4 ${
                    index !== comparisons.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="text-foreground">{item.feature}</span>
                  <span className="text-center text-muted-foreground">{item.free}</span>
                  <span className="text-center text-primary font-medium">{item.premium}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
