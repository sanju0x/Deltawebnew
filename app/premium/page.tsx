"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Music, Clock, Headphones, Star, Shield, RefreshCw } from "lucide-react";

interface PremiumFeature {
  _id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

interface PremiumPlan {
  _id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  color: string;
  popular: boolean;
  order: number;
}

interface PremiumComparison {
  _id: string;
  feature: string;
  free: string;
  premium: string;
  order: number;
}

// Default features if API doesn't return any
const defaultFeatures = [
  {
    icon: "Music",
    title: "Lossless Audio",
    description: "Experience music in the highest quality possible with lossless audio streaming.",
  },
  {
    icon: "Clock",
    title: "24/7 Mode",
    description: "Keep Delta in your voice channel around the clock, even when not playing.",
  },
  {
    icon: "Headphones",
    title: "Premium Effects",
    description: "Access exclusive audio effects like spatial audio, karaoke mode, and more.",
  },
  {
    icon: "Zap",
    title: "Priority Queue",
    description: "Your commands get processed faster with priority server access.",
  },
  {
    icon: "Star",
    title: "Unlimited Playlists",
    description: "Save unlimited playlists with up to 1000 tracks each.",
  },
  {
    icon: "Shield",
    title: "Premium Support",
    description: "Get priority support from our team with faster response times.",
  },
];

// Default plans if API doesn't return any
const defaultPlans = [
  {
    name: "Monthly",
    price: 4.99,
    duration: 30,
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
    price: 39.99,
    duration: 365,
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
    price: 99.99,
    duration: -1,
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

// Default comparisons if API doesn't return any
const defaultComparisons = [
  { feature: "Audio Quality", free: "128kbps", premium: "Lossless" },
  { feature: "Queue Length", free: "50 tracks", premium: "Unlimited" },
  { feature: "Saved Playlists", free: "3", premium: "Unlimited" },
  { feature: "Audio Effects", free: "Basic", premium: "All Effects" },
  { feature: "24/7 Mode", free: "No", premium: "Yes" },
  { feature: "Custom Prefix", free: "No", premium: "Yes" },
  { feature: "Support", free: "Community", premium: "Priority" },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Music,
  Clock,
  Headphones,
  Zap,
  Star,
  Shield,
  Crown,
};

function formatPrice(price: number, duration: number) {
  if (duration === -1) {
    return { amount: `$${price.toFixed(2)}`, period: "one-time" };
  } else if (duration === 30) {
    return { amount: `$${price.toFixed(2)}`, period: "/month" };
  } else if (duration === 365) {
    return { amount: `$${price.toFixed(2)}`, period: "/year" };
  } else {
    return { amount: `$${price.toFixed(2)}`, period: `/${duration} days` };
  }
}

export default function PremiumPage() {
  const [features, setFeatures] = useState<typeof defaultFeatures>(defaultFeatures);
  const [plans, setPlans] = useState<typeof defaultPlans>(defaultPlans);
  const [comparisons, setComparisons] = useState<typeof defaultComparisons>(defaultComparisons);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPremiumData = async () => {
      try {
        const response = await fetch("/api/premium");
        if (response.ok) {
          const data = await response.json();
          
          // Set features if available
          if (data.features && data.features.length > 0) {
            setFeatures(data.features.map((f: PremiumFeature) => ({
              icon: f.icon || "Star",
              title: f.title,
              description: f.description,
            })));
          }
          
          // Set plans if available
          if (data.plans && data.plans.length > 0) {
            setPlans(data.plans.map((p: PremiumPlan) => ({
              name: p.name,
              price: p.price,
              duration: p.duration,
              features: p.features,
              popular: p.popular,
            })));
          }
          
          // Set comparisons if available
          if (data.comparisons && data.comparisons.length > 0) {
            setComparisons(data.comparisons.map((c: PremiumComparison) => ({
              feature: c.feature,
              free: c.free,
              premium: c.premium,
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching premium data:", error);
        // Keep default values on error
      }
      setLoading(false);
    };

    fetchPremiumData();
  }, []);

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

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                {features.map((feature, index) => {
                  const IconComponent = iconMap[feature.icon] || Star;
                  return (
                    <div
                      key={index}
                      className="bg-card border border-border rounded-3xl p-6 hover:border-primary/50 transition-all group"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Pricing */}
              <div className="mb-20">
                <h2 className="text-3xl font-bold text-foreground text-center mb-10">Choose Your Plan</h2>
                <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {plans.map((plan, index) => {
                    const priceInfo = formatPrice(plan.price, plan.duration);
                    return (
                      <div
                        key={index}
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
                          <span className="text-4xl font-bold text-foreground">{priceInfo.amount}</span>
                          <span className="text-muted-foreground">{priceInfo.period}</span>
                        </div>
                        <p className="text-muted-foreground mb-6">
                          {plan.duration === -1 ? "Pay once, enjoy forever" : 
                           plan.duration === 365 ? "Best value - Save 33%" :
                           "Perfect for trying out premium features"}
                        </p>
                        <ul className="space-y-3 mb-8">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center gap-3 text-foreground">
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
                    );
                  })}
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
                      key={index}
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
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
