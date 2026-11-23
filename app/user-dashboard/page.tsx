"use client";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Clock3, Crown, Heart, ListMusic, Music2, Sparkles, Terminal, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrialStatus } from "@/lib/trial-types";

type Ranking = { name: string; count: number } | null;
type Profile = { username: string; permanent: boolean; trial: TrialStatus; playlists: {_id: string; name: string; size: number}[]; song: Ranking; command: Ranking };
function remaining(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(seconds/86400) + "d " + Math.floor(seconds/3600)%24 + "h " + Math.floor(seconds/60)%60 + "m " + seconds%60 + "s";
}

export default function UserDashboard() {
  const [data, setData] = useState<Profile | null>(null);
  const [signIn, setSignIn] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/user-dashboard", { cache: "no-store", signal: controller.signal }).then(async res => {
      if (res.status === 401) { setSignIn(true); return; }
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setData(body);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (data?.permanent || !data?.trial.active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [data?.permanent, data?.trial.active]);
  async function remove(id: string, name: string) {
    if (!window.confirm("Delete playlist " + name + "?")) return;
    setBusy(id); setError("");
    try {
      const res = await fetch("/api/user-dashboard?id=" + id, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error((await res.json()).error);
      setData(old => old && ({ ...old, playlists: old.playlists.filter(p => p._id !== id) }));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not delete playlist."); }
    finally { setBusy(""); }
  }
  const end = data?.trial.endsAt;
  const active = data?.trial.active && end && end > now;
  return <DashboardShell active="account" username={data?.username}>
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">Your Delta experience</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">User Dashboard</h1><p className="mt-2 text-sm text-white/50">Your music, access and playlists in one place.</p></div>
      <a href="https://delta-bot.online/premium" className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/15 px-4 py-2.5 text-sm font-bold text-emerald-300 hover:bg-emerald-400/25"><Crown className="size-4" />Premium</a>
    </div>
    {error && <p role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
    {signIn ? <section className="max-w-lg rounded-2xl border border-white/10 bg-[#1a1527] p-7"><div className="mb-4 grid size-12 place-items-center rounded-xl bg-violet-500/15"><UserRound className="size-6 text-violet-300" /></div><h2 className="text-xl font-bold">Welcome to your dashboard</h2><p className="mt-2 mb-6 text-sm text-white/55">Connect your Discord account to access playlists, usage stats, and your no-prefix benefits.</p><a className="inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-500" href="/api/dashboard/login?view=user">Sign in with Discord</a></section>
    : data ? <>
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#302044] via-[#28172f] to-[#171629] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl border border-white/20 bg-gradient-to-br from-violet-500 to-rose-700 text-2xl font-black">{data.username.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="text-xs text-white/50">Signed in as</p><h2 className="truncate text-2xl font-bold">{data.username}</h2><p className="mt-1 text-xs text-white/50">Manage your Delta experience</p></div></div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#332246] to-[#21182b] p-5">
          <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300"><Sparkles className="size-5" /></div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/45">No-prefix access</p><h3 className="mt-2 text-xl font-bold">{data.permanent ? "Permanent" : active ? "Active" : "Inactive"}</h3>
          <p className="mt-2 text-sm text-white/55">{data.permanent ? "Unlimited no-prefix access" : active ? remaining(end! - now) + " remaining" : "No active access"}</p>
          {!data.permanent && end && <p className="mt-3 flex items-center gap-1.5 text-xs text-white/40"><Clock3 className="size-3.5" />{end > now ? "Expires" : "Expired"} {new Date(end).toLocaleString()}</p>}
        </section>
        <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#1b3450] to-[#181c30] p-5">
          <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300"><Music2 className="size-5" /></div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/45">Most played song</p><h3 className="mt-2 break-words text-xl font-bold">{data.song?.name || "No activity yet"}</h3><p className="mt-2 text-sm text-white/55">{data.song ? `${data.song.count} plays` : "Start listening with Delta"}</p>
        </section>
        <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#4b2c31] to-[#261826] p-5">
          <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-red-400/15 text-red-300"><Terminal className="size-5" /></div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/45">Most used command</p><h3 className="mt-2 break-words text-xl font-bold">{data.command?.name || "No activity yet"}</h3><p className="mt-2 text-sm text-white/55">{data.command ? `${data.command.count} uses` : "Try your first command"}</p>
        </section>
      </div>
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1a1626]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-fuchsia-400/10 text-fuchsia-300"><ListMusic className="size-5" /></span><div><h3 className="text-xl font-bold">My Playlists</h3><p className="mt-1 text-xs text-white/45">{data.playlists.length} playlists saved</p></div></div>
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">Music library</span>
        </div>
        {!data.playlists.length ? <div className="flex flex-col items-center px-6 py-12 text-center"><Heart className="mb-3 size-10 text-white/25" /><h4 className="font-semibold">Your library is waiting</h4><p className="mt-2 max-w-sm text-sm text-white/45">Use <code className="rounded bg-white/10 px-2 py-1">/playlist create</code> in Discord to create your first playlist.</p></div>
        : <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">{data.playlists.map((p,index) => <article key={p._id} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3.5">
          <div className={`grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${index%3===0 ? "from-violet-500/35 to-blue-500/25" : index%3===1 ? "from-rose-500/35 to-purple-500/25" : "from-cyan-500/35 to-indigo-500/25"}`}><Music2 className="size-5 text-white/80" /></div>
          <div className="min-w-0 flex-1"><h4 className="truncate text-sm font-semibold" title={p.name}>{p.name}</h4><p className="mt-1 text-xs text-white/45">{p.size} tracks</p></div>
          <Button type="button" size="sm" variant="outline" disabled={!!busy} onClick={() => remove(p._id,p.name)} aria-label={"Delete " + p.name} className="shrink-0 border-white/10 bg-white/5 text-red-300 hover:bg-red-500/15 hover:text-red-200">{busy === p._id ? "Deleting..." : <Trash2 className="size-4" />}</Button>
        </article>)}</div>}
      </section>
    </> : !error && <p role="status" className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/60">Loading your dashboard...</p>}
  </DashboardShell>;
}
