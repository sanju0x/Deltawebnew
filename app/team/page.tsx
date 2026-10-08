"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  AudioLines,
  BriefcaseBusiness,
  Code2,
  Crown,
  Headphones,
  Palette,
  Sparkles,
  Users,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  TEAM_ROLE_CATEGORIES,
  getTeamRoleCategoryOrder,
  normalizeTeamRoleCategory,
} from "@/lib/team-roles";
import type { TeamRoleCategory } from "@/lib/team-roles";

interface TeamMember {
  _id?: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  role: string;
  roleCategory?: string;
  socialLink?: string;
  order?: number;
}

type RoleVisual = {
  icon: typeof Crown;
  description: string;
  gradient: string;
  iconSurface: string;
  accent: string;
  border: string;
  wash: string;
};

const roleConfig: Record<TeamRoleCategory, RoleVisual> = {
  "Project Owner": {
    icon: Crown,
    description: "Sets the vision and keeps Delta moving in the right direction.",
    gradient: "from-amber-400 to-orange-500",
    iconSurface: "bg-amber-500/12",
    accent: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/25",
    wash: "bg-amber-500/5",
  },
  "Lead Developer": {
    icon: Code2,
    description: "Builds the systems that keep every command fast and reliable.",
    gradient: "from-blue-500 to-cyan-500",
    iconSurface: "bg-blue-500/12",
    accent: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/25",
    wash: "bg-blue-500/5",
  },
  "Project Manager": {
    icon: BriefcaseBusiness,
    description: "Turns ideas into plans and keeps every release on track.",
    gradient: "from-emerald-500 to-teal-500",
    iconSurface: "bg-emerald-500/12",
    accent: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/25",
    wash: "bg-emerald-500/5",
  },
  "Creative Director": {
    icon: Palette,
    description: "Shapes Delta's visual language, personality, and creative direction.",
    gradient: "from-violet-500 to-fuchsia-500",
    iconSurface: "bg-violet-500/12",
    accent: "text-violet-700 dark:text-violet-400",
    border: "border-violet-500/25",
    wash: "bg-violet-500/5",
  },
  "Audio Server Manager": {
    icon: AudioLines,
    description: "Keeps the audio infrastructure tuned for smooth listening.",
    gradient: "from-orange-500 to-red-500",
    iconSurface: "bg-orange-500/12",
    accent: "text-orange-700 dark:text-orange-400",
    border: "border-orange-500/25",
    wash: "bg-orange-500/5",
  },
};

const defaultTeamRoles: Array<{ title: TeamRoleCategory; members: TeamMember[] }> = [
  { title: "Project Owner", members: [{ name: "Delta", avatar: "DL", role: "Project Owner" }] },
  {
    title: "Lead Developer",
    members: [
      { name: "SANJU", avatar: "SJ", role: "Lead Developer" },
      { name: "Emma Script", avatar: "ES", role: "Backend Developer" },
    ],
  },
  {
    title: "Project Manager",
    members: [
      { name: "Sarah Storm", avatar: "SS", role: "Project Manager" },
      { name: "Tom Wise", avatar: "TW", role: "Operations Manager" },
    ],
  },
  {
    title: "Creative Director",
    members: [
      { name: "Nina Guide", avatar: "NG", role: "Creative Director" },
      { name: "Oscar Fair", avatar: "OF", role: "Visual Designer" },
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

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch("/api/team", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.data)) setTeamMembers(data.data);
      } catch (error) {
        console.error("Failed to fetch team:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  const sections = useMemo(() => {
    if (teamMembers.length === 0) return defaultTeamRoles;

    const grouped = teamMembers.reduce((acc, member) => {
      const category = normalizeTeamRoleCategory(member.roleCategory || "");
      if (!acc[category]) acc[category] = [];
      acc[category].push(member);
      return acc;
    }, {} as Record<TeamRoleCategory, TeamMember[]>);

    return Object.entries(grouped)
      .sort(([left], [right]) => getTeamRoleCategoryOrder(left) - getTeamRoleCategoryOrder(right))
      .map(([title, members]) => ({
        title: title as TeamRoleCategory,
        members: members.sort((left, right) => (left.order ?? 0) - (right.order ?? 0)),
      }));
  }, [teamMembers]);

  const memberCount = sections.reduce((total, section) => total + section.members.length, 0);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />

      <main className="team-page relative flex-1 overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(circle_at_18%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_58%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[-8rem] top-48 size-96 rounded-full bg-[#5865f2]/8 blur-3xl" aria-hidden="true" />
        <div className="team-page-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl">
          <section className="team-hero grid items-end gap-10 border-b border-border/80 pb-12 lg:grid-cols-[1fr_auto]" aria-labelledby="team-heading">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="size-3.5" aria-hidden="true" />
                The people behind Delta
              </div>
              <h1 id="team-heading" className="text-5xl font-bold tracking-[-0.065em] sm:text-7xl lg:text-[5.4rem] lg:leading-[0.92]">
                Small team.
                <span className="block bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent">Big sound.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Meet the people shaping Delta—from product direction and engineering to the creative and audio systems behind every session.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-80 lg:grid-cols-2">
              <HeroStat value={String(memberCount)} label="Team members" />
              <HeroStat value={String(TEAM_ROLE_CATEGORIES.length)} label="Disciplines" />
              <div className="col-span-2 hidden rounded-2xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-xl sm:block">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Users className="size-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Built together</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">One team, one shared mission.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {loading ? (
            <TeamSkeleton />
          ) : (
            <div className="mt-14 space-y-16 sm:mt-16 sm:space-y-24">
              {sections.map((section, sectionIndex) => {
                const config = roleConfig[section.title];
                const RoleIcon = config.icon;

                return (
                  <section key={section.title} aria-labelledby={`role-${sectionIndex}`}>
                    <div className="mb-6 grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                      <span className={`grid size-14 place-items-center rounded-2xl border ${config.border} ${config.iconSurface} ${config.accent} shadow-sm`}>
                        <RoleIcon className="size-6" strokeWidth={2} aria-hidden="true" />
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-mono text-xs font-bold tracking-[0.18em] text-muted-foreground">{String(sectionIndex + 1).padStart(2, "0")}</p>
                          <h2 id={`role-${sectionIndex}`} className="text-2xl font-bold tracking-tight sm:text-3xl">{section.title}</h2>
                        </div>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{config.description}</p>
                      </div>

                      <span className={`hidden rounded-full border px-3 py-1.5 text-xs font-bold md:inline-flex ${config.border} ${config.iconSurface} ${config.accent}`}>
                        {section.members.length} {section.members.length === 1 ? "member" : "members"}
                      </span>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      {section.members.map((member, memberIndex) => (
                        <MemberCard
                          key={member._id || `${section.title}-${member.name}`}
                          member={member}
                          category={section.title}
                          config={config}
                          index={sectionIndex * 2 + memberIndex}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function MemberCard({ member, category, config, index }: { member: TeamMember; category: TeamRoleCategory; config: RoleVisual; index: number }) {
  const RoleIcon = config.icon;

  return (
    <article
      className={`team-member-card group relative isolate grid min-h-44 grid-cols-[6.5rem_1fr] overflow-hidden rounded-[1.5rem] border bg-card/90 shadow-sm transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-foreground/8 sm:grid-cols-[8rem_1fr] ${config.border}`}
      style={{ animationDelay: `${Math.min(index * 45, 315)}ms` }}
    >
      <div className={`pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${config.gradient}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-14 -top-20 size-44 rounded-full ${config.wash} blur-2xl transition-transform duration-300 group-hover:scale-125`} aria-hidden="true" />
      <div className="team-card-shine pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className={`relative m-3 mr-0 min-h-36 overflow-hidden rounded-[1.15rem] border ${config.border} bg-secondary shadow-sm sm:m-4 sm:mr-0`}>
        {member.avatarUrl ? (
          <Image src={member.avatarUrl} alt={`${member.name} portrait`} fill sizes="(max-width: 640px) 104px, 128px" className="object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        ) : (
          <div className={`grid size-full place-items-center bg-gradient-to-br ${config.gradient} text-2xl font-bold tracking-[-0.05em] text-white sm:text-3xl`} aria-hidden="true">
            <span className="transition-transform duration-300 ease-out group-hover:scale-110">{member.avatar || initialsFor(member.name)}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" aria-hidden="true" />
      </div>

      <div className="relative flex min-w-0 flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] ${config.border} ${config.iconSurface} ${config.accent}`}>
            <RoleIcon className="size-3" aria-hidden="true" />
            <span className="hidden min-[420px]:inline">{category}</span>
            <span className="min-[420px]:hidden">Team</span>
          </div>
          <span className="font-mono text-[0.68rem] font-bold tabular-nums text-muted-foreground/65">{String(index + 1).padStart(2, "0")}</span>
        </div>

        <div className="my-4 min-w-0">
          <h3 className="truncate text-xl font-bold tracking-[-0.035em] sm:text-2xl">{member.name}</h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{member.role}</p>
        </div>

        {member.socialLink ? (
          <a
            href={member.socialLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${member.name}'s profile`}
            className="group/link inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-border bg-background/80 px-3 text-xs font-bold text-muted-foreground transition-[background-color,border-color,color] duration-200 hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View profile
            <ArrowUpRight className="size-4 transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" aria-hidden="true" />
          </a>
        ) : (
          <div className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-muted-foreground/75">
            <Headphones className="size-4" aria-hidden="true" />
            Building the sound
          </div>
        )}
      </div>
    </article>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5">
      <p className="font-mono text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="mt-16 space-y-16" aria-label="Loading team members">
      {[0, 1].map((section) => (
        <div key={section} className="animate-pulse">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-muted" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded-full bg-muted" />
              <div className="h-3 w-72 max-w-[70vw] rounded-full bg-muted" />
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[0, 1].map((card) => <div key={card} className="h-44 rounded-[1.5rem] border border-border bg-card" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function initialsFor(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase();
}
