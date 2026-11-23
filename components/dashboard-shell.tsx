"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import { Bot, Headphones, LifeBuoy, LogOut, Menu, Music2, Server, UserRound, X } from "lucide-react";

type Section = "servers" | "account";
type Props = { children: ReactNode; active: Section; username?: string; avatarUrl?: string | null; onLogout?: () => void; loggingOut?: boolean };

const navigation = [
  { label: "Servers", href: "https://dash.delta-bot.online/", icon: Server, id: "servers" },
  { label: "My account", href: "https://delta-bot.online/user-dashboard", icon: UserRound, id: "account" },
  { label: "Commands", href: "https://delta-bot.online/commands", icon: Bot, id: "commands" },
  { label: "Support", href: "https://delta-bot.online/support", icon: LifeBuoy, id: "support" },
] as const;

export function DashboardShell({ children, active, username, avatarUrl, onLogout, loggingOut }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="min-h-screen bg-[#090909] px-3 py-3 text-[#f8f6ff] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1500px] overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#131112] shadow-[0_30px_100px_rgba(0,0,0,.55)]">
        <aside className="hidden w-[230px] shrink-0 flex-col border-r border-white/[0.07] bg-[#171416] p-5 lg:flex">
          <Link href="https://delta-bot.online/" className="mb-10 flex items-center gap-3 px-2" aria-label="Delta homepage">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-red-600 via-red-900 to-[#1c1114] shadow-lg shadow-red-950/40"><Music2 className="size-6 text-white" /></span>
            <span className="text-xl font-black tracking-tight">DELTA<span className="text-red-500">.</span></span>
          </Link>
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Workspace</p>
          <nav aria-label="Dashboard navigation" className="space-y-1.5">
            {navigation.map(({ id, label, href, icon: Icon }) =>
              <Link key={id} href={href} aria-current={id === active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${id === active ? "bg-gradient-to-r from-[#8f1625] to-[#b32634] text-white shadow-md shadow-red-950/30" : "text-white/55 hover:bg-white/[0.07] hover:text-white"}`}>
                <Icon className="size-[18px] shrink-0" /><span>{label}</span>
              </Link>)}
          </nav>
          <div className="mt-auto space-y-3 pt-10">
            {username && <div className="flex items-center gap-2 border-t border-white/10 pt-4">
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-red-500 to-red-900 text-sm font-bold">{avatarUrl ? <img src={avatarUrl} alt="" width={36} height={36} className="size-full object-cover" referrerPolicy="no-referrer" /> : username.slice(0,1).toUpperCase()}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{username}</span>
              {onLogout && <button type="button" title="Sign out" aria-label="Sign out" disabled={loggingOut} onClick={onLogout} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"><LogOut className="size-4" /></button>}
            </div>}
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-[radial-gradient(ellipse_at_50%_0%,rgba(125,28,41,.22),transparent_48%)]">
          <header className="flex h-[76px] items-center justify-between gap-3 border-b border-white/[0.07] px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button type="button" className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/80 lg:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
              <div className="flex items-center gap-2"><Headphones className="size-5 text-red-500" /><span className="text-sm font-bold tracking-widest">DELTA CONTROL</span></div>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300 sm:inline-flex">Dashboard</span>
              {username && <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-red-500 to-red-900 text-sm font-bold" title={username}>{avatarUrl ? <img src={avatarUrl} alt="" width={36} height={36} className="size-full object-cover" referrerPolicy="no-referrer" /> : username.slice(0,1).toUpperCase()}</span>}
            </div>
          </header>
          {menuOpen && <nav aria-label="Mobile menu" className="grid gap-1 border-b border-white/10 bg-[#211719] p-3 lg:hidden">
            {navigation.map(({ id, href, label, icon: Icon }) => <Link key={id} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${id === active ? "bg-red-600 text-white" : "text-white/70 hover:bg-white/10"}`}><Icon className="size-4" />{label}</Link>)}
            {onLogout && <button type="button" onClick={onLogout} disabled={loggingOut} className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-white/70"><LogOut className="size-4" />Sign out</button>}
          </nav>}
          <div className="px-4 pb-24 pt-6 sm:px-8 sm:pt-8 lg:pb-10">{children}</div>
        </div>
      </div>
      <nav aria-label="Mobile quick navigation" className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border border-white/10 bg-[#201618]/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
        {navigation.filter(({id}) => ["servers","account","support"].includes(id)).map(({id, href, label, icon: Icon})=><Link href={href} key={id} aria-current={id === active ? "page" : undefined} className={`flex min-w-[65px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold ${id === active ? "bg-[#8c1b2a] text-white" : "text-white/55"}`}><Icon className="size-5" />{label}</Link>)}
      </nav>
    </main>
  );
}
