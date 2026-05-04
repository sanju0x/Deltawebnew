"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Crown, Shield, Code, Users, Headphones, Server } from "lucide-react";

const teamRoles = [
  {
    title: "Founder",
    icon: Crown,
    color: "from-yellow-500 to-orange-500",
    members: [
      { name: "Alex Thunder", avatar: "AT", role: "Founder & Visionary" },
    ],
  },
  {
    title: "Owner",
    icon: Shield,
    color: "from-primary to-red-700",
    members: [
      { name: "Sarah Storm", avatar: "SS", role: "Owner & Lead Manager" },
    ],
  },
  {
    title: "Developer",
    icon: Code,
    color: "from-blue-500 to-cyan-500",
    members: [
      { name: "Mike Coder", avatar: "MC", role: "Lead Developer" },
      { name: "Emma Script", avatar: "ES", role: "Backend Developer" },
    ],
  },
  {
    title: "Assistant Developer",
    icon: Code,
    color: "from-purple-500 to-pink-500",
    members: [
      { name: "Jake Python", avatar: "JP", role: "Assistant Developer" },
      { name: "Lily Node", avatar: "LN", role: "Junior Developer" },
    ],
  },
  {
    title: "Council",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    members: [
      { name: "Tom Wise", avatar: "TW", role: "Council Member" },
      { name: "Nina Guide", avatar: "NG", role: "Council Member" },
      { name: "Oscar Fair", avatar: "OF", role: "Council Member" },
    ],
  },
  {
    title: "Audio Server Manager",
    icon: Headphones,
    color: "from-orange-500 to-red-500",
    members: [
      { name: "Dave Sound", avatar: "DS", role: "Audio Lead" },
      { name: "Ray Bass", avatar: "RB", role: "Server Manager" },
    ],
  },
];

export default function TeamPage() {
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

          <div className="space-y-12">
            {teamRoles.map((role) => (
              <div key={role.title} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${role.color}`}>
                    <role.icon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{role.title}</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {role.members.map((member) => (
                    <div
                      key={member.name}
                      className="group bg-card border border-border rounded-3xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white font-bold text-lg`}>
                          {member.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {member.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
