"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AudioLines,
  BriefcaseBusiness,
  Code2,
  Crown,
  ExternalLink,
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
    description: "Shapes Delta’s visual language, personality, and creative direction.",
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
  {
    title: "Project Owner",
    members: [{ name: "Delta", avatar: "DL", role: "Project Owner" }],
  },
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

      <main className="relative flex-1 overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_25%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_62%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[-8rem] top-56 size-96 rounded-full bg-[#5865f2]/8 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl">
          <section className="grid items-end gap-10 border-b border-border pb-12 lg:grid-cols-[1fr_auto]" aria-labelledby="team-heading">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
                The people behind the music
              </div>
              <h1 id="team-heading" className="text-5xl font-bold tracking-[-0.055em] sm:text-7xl">
                Small team.
                <span className="block text-primary">Big sound.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Meet the people shaping Delta—from product direction and engineering to the creative and audio systems behind every session.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-80 lg:grid-cols-2">
              <HeroStat value={String(memberCount)} label="Team members" />
              <HeroStat value={String(TEAM_ROLE_CATEGORIES.length)} label="Disciplines" />
              <div className="col-span-2 hidden rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur sm:block lg:block">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Users className="size-4.5" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold">One team, one shared mission.</p>
                </div>
              </div>
            </div>
          </section>

          {loading ? (
            <TeamSkeleton />
          ) : (
            <div className="mt-14 space-y-14 sm:mt-16 sm:space-y-20">
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

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {section.members.map((member) => (
                        <MemberCard key={member._id || `${section.title}-${member.name}`} member={member} category={section.title} config={config} />
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

function MemberCard({ member, category, config }: { member: TeamMember; category: TeamRoleCategory; config: RoleVisual }) {
  const RoleIcon = config.icon;

  return (
    <article className={`group relative overflow-hidden rounded-[1.75rem] border bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/5 ${config.border}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.gradient}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-16 -top-16 size-40 rounded-full ${config.wash} blur-2xl`} aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-4">
        {member.avatarUrl ? (
          <div className={`size-16 overflow-hidden rounded-2xl border ${config.border} bg-secondary shadow-sm`}>
            <Image src={member.avatarUrl} alt={`${member.name} portrait`} width={64} height={64} className="size-full object-cover" />
          </div>
        ) : (
          <div className={`grid size-16 place-items-center rounded-2xl bg-gradient-to-br ${config.gradient} text-lg font-bold tracking-tight text-white shadow-md`} aria-hidden="true">
            {member.avatar || initialsFor(member.name)}
          </div>
        )}

        {member.socialLink && (
          <a
            href={member.socialLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${member.name}'s profile`}
            className="grid size-11 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}
      </div>

      <div className="relative mt-5">
        <h3 className="text-lg font-bold tracking-tight">{member.name}</h3>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{member.role}</p>
        <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-bold ${config.border} ${config.iconSurface} ${config.accent}`}>
          <RoleIcon className="size-3.5" aria-hidden="true" />
          {category}
        </div>
      </div>
    </article>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((card) => <div key={card} className="h-56 rounded-[1.75rem] border border-border bg-card" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function initialsFor(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase();
}
