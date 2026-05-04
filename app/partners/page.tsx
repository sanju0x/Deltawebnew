"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, Users, Server, Zap, RefreshCw } from "lucide-react";
import Image from "next/image";

interface Partner {
  _id: string;
  name: string;
  description: string;
  logo: string;
  iconUrl?: string;
  bannerUrl?: string;
  website?: string;
  inviteLink?: string;
  members?: string;
  type: "featured" | "community";
  features?: string[];
  order: number;
}

const defaultMainPartners = [
  {
    name: "Endercloud",
    description: "Premium Minecraft and Discord bot hosting solutions with 99.9% uptime guarantee. Trusted by thousands of communities worldwide.",
    logo: "EC",
    color: "from-emerald-500 to-green-600",
    website: "https://endercloud.com",
    features: ["24/7 Support", "DDoS Protection", "Auto Scaling"],
    stats: { servers: "50K+", users: "2M+" },
  },
  {
    name: "CloudNode",
    description: "Enterprise-grade cloud infrastructure for bots and applications. Lightning-fast performance with global edge locations.",
    logo: "CN",
    color: "from-blue-500 to-cyan-500",
    website: "#",
    features: ["Global CDN", "Auto Backups", "API Access"],
    stats: { servers: "30K+", users: "1.5M+" },
  },
  {
    name: "BotList Hub",
    description: "The largest Discord bot listing platform. Discover, vote, and share amazing bots with millions of users.",
    logo: "BH",
    color: "from-purple-500 to-pink-500",
    website: "#",
    features: ["Bot Analytics", "Vote Rewards", "Premium Listing"],
    stats: { servers: "100K+", users: "5M+" },
  },
];

const defaultCommunityPartners = [
  {
    name: "Music Lovers United",
    description: "A community of music enthusiasts sharing playlists and discoveries.",
    logo: "ML",
    color: "from-primary to-red-700",
    members: "25K+",
  },
  {
    name: "Gaming Central",
    description: "One of the largest gaming communities on Discord.",
    logo: "GC",
    color: "from-orange-500 to-amber-500",
    members: "150K+",
  },
  {
    name: "Tech Talk",
    description: "Developers and tech enthusiasts discussing the latest trends.",
    logo: "TT",
    color: "from-indigo-500 to-violet-500",
    members: "80K+",
  },
  {
    name: "Chill Zone",
    description: "A relaxed community for hanging out and making friends.",
    logo: "CZ",
    color: "from-teal-500 to-cyan-500",
    members: "45K+",
  },
  {
    name: "Anime Hub",
    description: "The ultimate destination for anime fans and discussions.",
    logo: "AH",
    color: "from-pink-500 to-rose-500",
    members: "200K+",
  },
  {
    name: "Creative Corner",
    description: "Artists, designers, and creators sharing their work.",
    logo: "CC",
    color: "from-yellow-500 to-orange-500",
    members: "60K+",
  },
];

const colorPalette = [
  "from-emerald-500 to-green-600",
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-primary to-red-700",
  "from-orange-500 to-amber-500",
  "from-indigo-500 to-violet-500",
  "from-teal-500 to-cyan-500",
  "from-pink-500 to-rose-500",
  "from-yellow-500 to-orange-500",
];

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch("/api/partners");
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            setPartners(data.data);
          } else {
            setUseApi(false);
          }
        } else {
          setUseApi(false);
        }
      } catch {
        setUseApi(false);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  const featuredPartners = partners.filter((p) => p.type === "featured");
  const communityPartners = partners.filter((p) => p.type === "community");

  const getColor = (index: number) => colorPalette[index % colorPalette.length];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our <span className="text-primary">Partners</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We&apos;re proud to partner with amazing companies and communities that share our vision.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : useApi && partners.length > 0 ? (
            <>
              {/* Featured Partners */}
              {featuredPartners.length > 0 && (
                <div className="mb-20">
                  <div className="flex items-center gap-3 mb-8">
                    <Star className="h-6 w-6 text-yellow-500" />
                    <h2 className="text-2xl font-bold text-foreground">Featured Partners</h2>
                  </div>
                  
                  <div className="grid lg:grid-cols-3 gap-6">
                    {featuredPartners.map((partner, index) => (
                      <div
                        key={partner._id}
                        className="group bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-300"
                      >
                        {/* Banner */}
                        {partner.bannerUrl && (
                          <div className="h-32 w-full relative">
                            <Image
                              src={partner.bannerUrl}
                              alt={`${partner.name} banner`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                          </div>
                        )}
                        
                        <div className={`p-8 ${partner.bannerUrl ? "-mt-12 relative z-10" : ""}`}>
                          <div className="flex items-center gap-4 mb-6">
                            {partner.iconUrl ? (
                              <div className="h-16 w-16 rounded-2xl overflow-hidden ring-4 ring-card">
                                <Image
                                  src={partner.iconUrl}
                                  alt={partner.name}
                                  width={64}
                                  height={64}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${getColor(index)} flex items-center justify-center text-white font-bold text-xl`}>
                                {partner.logo}
                              </div>
                            )}
                            <div>
                              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                {partner.name}
                              </h3>
                              {partner.members && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Users className="h-3 w-3" /> {partner.members}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground mb-6">{partner.description}</p>
                          
                          {partner.features && partner.features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                              {partner.features.map((feature) => (
                                <span
                                  key={feature}
                                  className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            {partner.website && (
                              <Button
                                className="flex-1 rounded-full bg-secondary hover:bg-primary text-foreground hover:text-primary-foreground transition-all"
                                asChild
                              >
                                <a href={partner.website} target="_blank" rel="noopener noreferrer">
                                  Website
                                  <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {partner.inviteLink && (
                              <Button
                                className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                                asChild
                              >
                                <a href={partner.inviteLink} target="_blank" rel="noopener noreferrer">
                                  Join Server
                                  <Server className="ml-2 h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Partners */}
              {communityPartners.length > 0 && (
                <div className="mb-20">
                  <div className="flex items-center gap-3 mb-8">
                    <Users className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Community Partners</h2>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {communityPartners.map((partner, index) => (
                      <div
                        key={partner._id}
                        className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all"
                      >
                        {/* Mini Banner */}
                        {partner.bannerUrl && (
                          <div className="h-20 w-full relative">
                            <Image
                              src={partner.bannerUrl}
                              alt={`${partner.name} banner`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                          </div>
                        )}
                        
                        <div className={`p-5 flex items-center gap-4 ${partner.bannerUrl ? "-mt-6 relative z-10" : ""}`}>
                          {partner.iconUrl ? (
                            <div className="h-12 w-12 rounded-xl overflow-hidden ring-2 ring-card shrink-0">
                              <Image
                                src={partner.iconUrl}
                                alt={partner.name}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getColor(index)} flex items-center justify-center text-white font-bold shrink-0`}>
                              {partner.logo}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {partner.name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">{partner.description}</p>
                            {partner.members && (
                              <span className="text-xs text-primary font-medium">{partner.members} members</span>
                            )}
                          </div>
                          {partner.inviteLink && (
                            <a
                              href={partner.inviteLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Default Featured Partners */}
              <div className="mb-20">
                <div className="flex items-center gap-3 mb-8">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-foreground">Featured Partners</h2>
                </div>
                
                <div className="grid lg:grid-cols-3 gap-6">
                  {defaultMainPartners.map((partner) => (
                    <div
                      key={partner.name}
                      className="bg-card border border-border rounded-3xl p-8 hover:border-primary/50 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${partner.color} flex items-center justify-center text-white font-bold text-xl`}>
                          {partner.logo}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {partner.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Server className="h-3 w-3" /> {partner.stats.servers}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {partner.stats.users}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-6">{partner.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {partner.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                      
                      <Button
                        className="w-full rounded-full bg-secondary hover:bg-primary text-foreground hover:text-primary-foreground transition-all"
                        asChild
                      >
                        <a href={partner.website} target="_blank" rel="noopener noreferrer">
                          Visit Website
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Default Community Partners */}
              <div className="mb-20">
                <div className="flex items-center gap-3 mb-8">
                  <Users className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Community Partners</h2>
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {defaultCommunityPartners.map((partner) => (
                    <div
                      key={partner.name}
                      className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all group flex items-center gap-4"
                    >
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${partner.color} flex items-center justify-center text-white font-bold shrink-0`}>
                        {partner.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {partner.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{partner.description}</p>
                        <span className="text-xs text-primary font-medium">{partner.members} members</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Become a Partner */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-3xl p-10 text-center">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-4">Become a Partner</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Interested in partnering with Delta? We&apos;re always looking for amazing communities and businesses to collaborate with.
            </p>
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">
              Apply for Partnership
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
