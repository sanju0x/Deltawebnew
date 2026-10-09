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
  Music2,
  Palette,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
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
  badge: string;
  portrait: string;
  kicker: string;
};

const roleConfig: Record<TeamRoleCategory, RoleVisual> = {
  "Project Owner": {
    icon: Crown,
    description: "Protecting the vision and deciding what Delta becomes next.",
    badge: "bg-primary text-primary-foreground",
    portrait: "from-[#ef554a] to-[#bd261f]",
    kicker: "Direction",
  },
  "Lead Developer": {
    icon: Code2,
    description: "Turning ambitious ideas into systems that stay fast and reliable.",
    badge: "bg-foreground text-background",
    portrait: "from-[#413a34] to-[#181512]",
    kicker: "Engineering",
  },
  "Project Manager": {
    icon: BriefcaseBusiness,
    description: "Keeping people, priorities, and every release moving in rhythm.",
    badge: "bg-amber-300 text-stone-950",
    portrait: "from-[#f5ca58] to-[#de8f24]",
    kicker: "Operations",
  },
  "Creative Director": {
    icon: Palette,
    description: "Giving Delta its voice, visual language, and unmistakable character.",
    badge: "bg-rose-200 text-stone-950",
    portrait: "from-[#f7a69d] to-[#dd554a]",
    kicker: "Creative",
  },
  "Audio Server Manager": {
    icon: AudioLines,
    description: "Tuning the infrastructure behind smooth, shared listening sessions.",
    badge: "bg-orange-200 text-stone-950",
    portrait: "from-[#ee9a53] to-[#cf482d]",
    kicker: "Audio systems",
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

const waveform = [34, 58, 82, 48, 72, 96, 64, 42, 76, 54, 88, 68, 38, 62, 92, 56, 78, 44];

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTeam = async () => {
      try {
        const response = await fetch("/api/team", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = await response.json();
        if (Array.isArray(data.data)) setTeamMembers(data.data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Failed to fetch team:", error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchTeam();
    return () => controller.abort();
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

      <main id="main-content" className="team-page flex-1 overflow-hidden">
        <section className="team-studio-hero" aria-labelledby="team-heading">
          <div className="team-paper-grid" aria-hidden="true" />
          <div className="team-orb team-orb-one" aria-hidden="true" />
          <div className="team-orb team-orb-two" aria-hidden="true" />

          <div className="site-container team-hero-layout">
            <div className="team-hero-copy">
              <div className="team-eyebrow">
                <Music2 className="size-4" aria-hidden="true" />
                Behind the playback
              </div>
              <h1 id="team-heading">
                Meet the people
                <span>behind the beat.</span>
              </h1>
              <p>
                A compact crew of builders, listeners, and creative minds making every Delta session feel effortless.
              </p>

              <div className="team-hero-meta" aria-label="Team overview">
                <div>
                  <strong>{String(memberCount).padStart(2, "0")}</strong>
                  <span>People</span>
                </div>
                <div>
                  <strong>{String(sections.length).padStart(2, "0")}</strong>
                  <span>Disciplines</span>
                </div>
                <div>
                  <strong>01</strong>
                  <span>Shared rhythm</span>
                </div>
              </div>
            </div>

            <div className="team-console" aria-label="Delta studio: one team, always listening">
              <div className="team-console-topline">
                <span><i aria-hidden="true" /> Delta studio</span>
                <span>Live roster</span>
              </div>
              <div className="team-console-copy">
                <p>One team</p>
                <strong>Always listening.</strong>
              </div>
              <div className="team-sound-wave" aria-hidden="true">
                {waveform.map((height, index) => (
                  <span key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
              <div className="team-console-footer">
                <div className="team-avatar-stack" aria-hidden="true">
                  {sections.slice(0, 4).map((section, index) => (
                    <span key={section.title}>{section.members[0]?.avatar || String(index + 1).padStart(2, "0")}</span>
                  ))}
                </div>
                <span>Built by listeners, for listeners.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="team-roster-section" aria-labelledby="roster-heading">
          <div className="site-container">
            <div className="team-section-intro">
              <div>
                <p className="team-section-index">01 / The roster</p>
                <h2 id="roster-heading">Different roles.<br />One frequency.</h2>
              </div>
              <p>
                Delta is shaped by people with distinct crafts and one shared standard: make listening together feel simple, fast, and alive.
              </p>
            </div>

            {loading ? (
              <TeamSkeleton />
            ) : (
              <div className="team-roster">
                {sections.map((section, sectionIndex) => {
                  const config = roleConfig[section.title];
                  const RoleIcon = config.icon;

                  return (
                    <section
                      key={section.title}
                      className="team-role-row"
                      aria-labelledby={`role-${sectionIndex}`}
                    >
                      <div className="team-role-heading">
                        <div className={`team-role-icon ${config.badge}`}>
                          <RoleIcon className="size-6" strokeWidth={2} aria-hidden="true" />
                        </div>
                        <p className="team-role-number">{String(sectionIndex + 1).padStart(2, "0")}</p>
                        <p className="team-role-kicker">{config.kicker}</p>
                        <h3 id={`role-${sectionIndex}`}>{section.title}</h3>
                        <p className="team-role-description">{config.description}</p>
                        <p className="team-role-count">
                          {section.members.length} {section.members.length === 1 ? "person" : "people"}
                        </p>
                      </div>

                      <div className="team-members-grid">
                        {section.members.map((member, memberIndex) => (
                          <MemberCard
                            key={member._id || `${section.title}-${member.name}`}
                            member={member}
                            category={section.title}
                            config={config}
                            index={sectionIndex * 3 + memberIndex}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="team-closing-section">
          <div className="site-container">
            <div className="team-closing-card">
              <div className="team-closing-icon" aria-hidden="true">
                <UsersRound className="size-8" />
              </div>
              <p className="team-section-index">02 / Our thing</p>
              <h2>Small team.<br /><span>Big sound.</span></h2>
              <p className="team-closing-copy">
                We care about the details you notice, the ones you never should, and the moments music makes better.
              </p>
              <div className="team-closing-note">
                <Sparkles className="size-5" aria-hidden="true" />
                Made with care, tuned together.
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function MemberCard({
  member,
  category,
  config,
  index,
}: {
  member: TeamMember;
  category: TeamRoleCategory;
  config: RoleVisual;
  index: number;
}) {
  return (
    <article
      className="team-profile-card"
      style={{ animationDelay: `${Math.min(index * 45, 315)}ms` }}
    >
      <div className="team-profile-portrait">
        {member.avatarUrl ? (
          <Image
            src={member.avatarUrl}
            alt={`${member.name} portrait`}
            fill
            sizes="(max-width: 767px) calc(100vw - 2.5rem), (max-width: 1199px) 40vw, 360px"
            className="object-cover"
          />
        ) : (
          <div className={`team-profile-fallback bg-gradient-to-br ${config.portrait}`} aria-hidden="true">
            <span>{member.avatar || initialsFor(member.name)}</span>
          </div>
        )}

        <span className="team-profile-sequence">{String(index + 1).padStart(2, "0")}</span>
        <span className={`team-profile-category ${config.badge}`}>{config.kicker}</span>
      </div>

      <div className="team-profile-body">
        <div>
          <p>{category}</p>
          <h4>{member.name}</h4>
          <span>{member.role}</span>
        </div>

        {member.socialLink ? (
          <a
            href={member.socialLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${member.name}'s profile in a new tab`}
            className="team-profile-link"
          >
            Profile
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        ) : (
          <div className="team-profile-status">
            <Headphones className="size-4" aria-hidden="true" />
            Building the sound
          </div>
        )}
      </div>
    </article>
  );
}

function TeamSkeleton() {
  return (
    <div className="team-skeleton" role="status" aria-live="polite">
      <span className="sr-only">Loading team members</span>
      {[0, 1].map((section) => (
        <div key={section} className="team-skeleton-row">
          <div className="team-skeleton-heading">
            <div />
            <span />
            <span />
          </div>
          <div className="team-skeleton-cards">
            {[0, 1].map((card) => <div key={card} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
