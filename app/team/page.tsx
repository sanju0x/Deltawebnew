"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Crown, Shield, Code, Users, Headphones, RefreshCw, ExternalLink } from "lucide-react";
import Image from "next/image";

interface TeamMember {
  _id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  role: string;
  roleCategory: string;
  socialLink?: string;
  order: number;
}

const roleConfig: Record<string, { icon: typeof Crown; color: string; glowClass: string }> = {
  Founder: { icon: Crown, color: "from-yellow-500 to-orange-500", glowClass: "glow-founder" },
  Owner: { icon: Shield, color: "from-primary to-red-700", glowClass: "glow-owner" },
  Developer: { icon: Code, color: "from-blue-500 to-cyan-500", glowClass: "glow-developer" },
  "Assistant Developer": { icon: Code, color: "from-purple-500 to-pink-500", glowClass: "glow-assistant" },
  Council: { icon: Users, color: "from-green-500 to-emerald-500", glowClass: "glow-council" },
  "Audio Server Manager": { icon: Headphones, color: "from-orange-500 to-red-500", glowClass: "glow-audio" },
};

const defaultTeamRoles = [
  {
    title: "Founder",
    members: [{ name: "Delta", avatar: "Dl", role: "Founder & Visionary" }],
  },
  {
    title: "Owner",
    members: [{ name: "Sarah Storm", avatar: "SS", role: "Owner & Lead Manager" }],
  },
  {
    title: "Developer",
    members: [
      { name: "SANJU", avatar: "GOD", role: "Lead Developer" },
      { name: "Emma Script", avatar: "ES", role: "Backend Developer" },
    ],
  },
  {
    title: "Assistant Developer",
    members: [
      { name: "Jake Python", avatar: "JP", role: "Assistant Developer" },
      { name: "Lily Node", avatar: "LN", role: "Junior Developer" },
    ],
  },
  {
    title: "Council",
    members: [
      { name: "Tom Wise", avatar: "TW", role: "Council Member" },
      { name: "Nina Guide", avatar: "NG", role: "Council Member" },
      { name: "Oscar Fair", avatar: "OF", role: "Council Member" },
    ],
  },
  {
    title: "Audio Server Manager",
    members: [
      { name: "Dave Sound", avatar: "DS", role: "Audio Lead" },
      { name: "Ray Bass", avatar: "RB", role: "Server Manager" },
    ],
  },
];

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch("/api/team");
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            setTeamMembers(data.data);
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
    fetchTeam();
  }, []);

  const groupedMembers = teamMembers.reduce((acc, member) => {
    if (!acc[member.roleCategory]) {
      acc[member.roleCategory] = [];
    }
    acc[member.roleCategory].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  const renderTeamCard = (
    member: { name: string; avatar: string; role: string; avatarUrl?: string; socialLink?: string },
    roleColor: string,
    glowClass: string,
    index: number
  ) => (
    <div
      key={member.name}
      className={`animated-card ${glowClass} animated-card-delay-${(index % 6) + 1} group relative bg-card border border-border rounded-3xl p-6 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden`}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${roleColor} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      
      {/* Animated border glow */}
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${roleColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`} />
      
      <div className="relative flex items-center gap-4">
        {/* Avatar with animation */}
        <div className="relative">
          {member.avatarUrl ? (
            <div className={`h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-transparent group-hover:ring-primary/50 transition-all duration-500 group-hover:scale-110`}>
              <Image
                src={member.avatarUrl}
                alt={member.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-white font-bold text-lg ring-2 ring-transparent group-hover:ring-primary/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
              {member.avatar}
            </div>
          )}
          
          {/* Online indicator animation */}
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-card group-hover:animate-pulse" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
              {member.name}
            </h3>
            {member.socialLink && (
              <a
                href={member.socialLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
            {member.role}
          </p>
        </div>
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Meet Our <span className="text-primary">Team</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The talented individuals behind Delta who work tirelessly to bring you the best Discord music experience.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : useApi && teamMembers.length > 0 ? (
            <div className="space-y-12">
              {Object.entries(groupedMembers).map(([category, members]) => {
                const config = roleConfig[category] || { icon: Users, color: "from-gray-500 to-gray-600", glowClass: "glow-developer" };
                const IconComponent = config.icon;
                
                return (
                  <div key={category} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.color} shadow-lg`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">{category}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {members
                        .sort((a, b) => a.order - b.order)
                        .map((member, index) => renderTeamCard(member, config.color, config.glowClass, index))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-12">
              {defaultTeamRoles.map((role) => {
                const config = roleConfig[role.title] || { icon: Users, color: "from-gray-500 to-gray-600", glowClass: "glow-developer" };
                const IconComponent = config.icon;
                
                return (
                  <div key={role.title} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.color} shadow-lg`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">{role.title}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {role.members.map((member, index) => renderTeamCard(member, config.color, config.glowClass, index))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
