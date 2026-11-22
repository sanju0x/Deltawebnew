"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ServerConfigEditor } from "@/components/server-config-editor";

type Guild = { id: string; name: string; icon: string | null; role: string; available: boolean };
type Account = { clientId: string; user: { id: string; name: string }; guilds: Guild[] };
export default function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Guild | null>(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.status === 401) { setAccount(null); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load servers.");
      setAccount(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load dashboard."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    void load().then(() => {
      const reason = new URLSearchParams(window.location.search).get("error");
      if (reason) setError(reason === "configuration" ? "Discord dashboard login is not configured yet." : "Discord login was cancelled or expired. Please sign in again.");
    });
  }, []);
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch("/api/dashboard/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Try again.");
      window.location.replace("/dashboard");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not sign out."); }
    finally { setBusy(false); }
  }
  const ready = account?.guilds.filter(guild => guild.available) ?? [];
  const other = account?.guilds.filter(guild => !guild.available) ?? [];
  function renderGuild(guild: Guild) {
    return <GuildCard key={guild.id} guild={guild} clientId={account!.clientId} onManage={setSelected} />;
  }
  return <main className="premium-page min-h-screen"><Header />
    <section className="site-container py-16 sm:py-24">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-5">
        <div><p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Delta dashboard</p><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your server. Your settings.</h1><p className="mt-4 max-w-2xl text-muted-foreground">Choose a server to configure music, commands and Delta’s profile. You need Manage Server, Administrator, or server ownership.</p></div>
        {account && <div className="space-y-3"><p className="text-sm">Signed in as {account.user.name}</p><Button variant="outline" disabled={busy} onClick={() => void logout()}>Sign out</Button></div>}
      </div>
      {error && <p role="alert" className="mb-6 rounded-xl border border-destructive/30 p-4 text-destructive">{error}</p>}
      {loading ? <p role="status">Loading your servers…</p> : !account ? <div className="max-w-xl space-y-5 rounded-3xl border border-border bg-card p-8"><h2 className="text-2xl font-bold">Connect with Discord</h2><p className="text-muted-foreground">Sign in to see the servers you can manage.</p><a className="button-primary" href="/api/dashboard/login">Log in with Discord</a></div> : selected ? <div className="mx-auto max-w-6xl"><Button variant="outline" className="mb-6" onClick={() => setSelected(null)}>All servers</Button><ServerConfigEditor key={selected.id} guildId={selected.id} /></div> : <>
        <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-bold">Servers you can manage</h2><Button variant="outline" onClick={() => void load()}>Refresh servers</Button></div>
        {!account.guilds.length && <p className="rounded-2xl border border-border p-7">No servers found. You must own a server or have Administrator or Manage Server permission.</p>}
        {!ready.length && other.length > 0 && <p className="text-muted-foreground">Delta is not online in any of your manageable servers.</p>}
        {ready.length > 0 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{ready.map(renderGuild)}</div>}
        {other.length > 0 && <details className="mt-6 rounded-sm border border-border p-5">
          <summary className="cursor-pointer font-semibold">Invite Delta or check availability ({other.length})</summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{other.map(renderGuild)}</div>
        </details>}
      </>}
    </section><Footer /></main>;
}

function GuildCard({ guild, clientId, onManage }: { guild: Guild; clientId: string; onManage: (guild: Guild) => void }) {
  return <article className="flex flex-col gap-5 rounded-sm border border-border bg-card p-6">
          <div className="flex items-center gap-4">{guild.icon ? <img alt="" width={48} height={48} className="rounded-xl" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=96`} /> : <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-lg font-bold text-primary">{guild.name.slice(0, 2)}</span>}<div className="min-w-0"><h3 className="break-words text-lg font-semibold">{guild.name}</h3><span className="text-sm text-muted-foreground">{guild.role}</span></div></div>
          <p className="text-sm text-muted-foreground">{guild.available ? "Delta is ready to configure." : "Invite Delta or wait for it to come online."}</p>
          {guild.available ? <Button className="mt-auto" onClick={() => onManage(guild)}>Manage server</Button> : <a className="button-primary mt-auto" href={`https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&scope=bot%20applications.commands&permissions=0&guild_id=${guild.id}&disable_guild_select=true`}>Add Delta</a>}
        </article>;
}
