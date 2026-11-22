"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
  return <main className="premium-page min-h-screen"><Header /><section className="site-container space-y-8 py-16">
    <h1 className="text-4xl font-bold">User dashboard</h1>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {signIn ? <a className="button-primary" href="/api/dashboard/login?view=user">Sign in with Discord</a> : data ? <>
      <p>Signed in as {data.username}</p>
      <div className="grid gap-4 md:grid-cols-3"><section className="space-y-2 rounded-xl border bg-card p-5"><h2 className="font-semibold">No-prefix access</h2>
        <p>{data.permanent ? "Permanent access" : active ? remaining(end! - now) + " remaining" : "Inactive"}</p>
        {!data.permanent && end ? <p className="text-sm text-muted-foreground">{end > now ? "Expiry" : "Expired"} &middot; {new Date(end).toLocaleString()}</p> : null}</section>
        {([["Most played song", data.song], ["Most used command", data.command]] as const).map(([label, entry]) => <section key={label} className="space-y-2 rounded-xl border bg-card p-5"><h2 className="font-semibold">{label}</h2><p>{entry?.name || "No activity yet"}</p>{entry && <small>{entry.count} {label === "Most played song" ? "plays" : "uses"}</small>}</section>)}
      </div>
      <section className="rounded-xl border bg-card p-5"><h2 className="mb-4 text-xl font-semibold">Your playlists ({data.playlists.length})</h2>
        {!data.playlists.length && <p>Create your first playlist with <code>/playlist create</code> in Discord.</p>}
        {data.playlists.map(p => <div key={p._id} className="flex items-center justify-between gap-3 border-t py-3"><div>{p.name}<small className="block text-muted-foreground">{p.size} tracks</small></div><Button variant="outline" disabled={!!busy} onClick={() => remove(p._id,p.name)} aria-label={"Delete " + p.name}>{busy === p._id ? "Deleting..." : "Delete"}</Button></div>)}
      </section>
    </> : !error && <p role="status">Loading your dashboard...</p>}
  </section><Footer /></main>;
}
