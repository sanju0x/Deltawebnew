"use client";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { discordAvatarUrl } from "@/lib/discord-avatar";
import { Button } from "@/components/ui/button";
import { ServerConfigEditor } from "@/components/server-config-editor";
import { ArrowLeft, CheckCircle2, Search, Server, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

type Guild = { id: string; name: string; icon: string | null; role: string; available: boolean };
type Account = { clientId: string; user: { id: string; name: string; avatar: string | null }; guilds: Guild[] };
export default function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Guild | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverSearch, setServerSearch] = useState("");
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
  const ready = account?.guilds.filter(guild => guild.available && guild.name.toLowerCase().includes(serverSearch.trim().toLowerCase())) ?? [];
  const other = account?.guilds.filter(guild => !guild.available && guild.name.toLowerCase().includes(serverSearch.trim().toLowerCase())) ?? [];
  function renderGuild(guild: Guild) {
    return <GuildCard key={guild.id} guild={guild} clientId={account!.clientId} onManage={setSelected} />;
  }
  return <DashboardShell active="servers" username={account?.user.name} avatarUrl={account ? discordAvatarUrl(account.user.id, account.user.avatar) : null} onLogout={account ? () => void logout() : undefined} loggingOut={busy}>
    {selected ? <div className="mx-auto max-w-6xl space-y-5">
      <Button variant="outline" className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setSelected(null)}><ArrowLeft className="size-4" />All servers</Button>
      <ServerConfigEditor key={selected.id} guildId={selected.id} />
    </div> : <>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">Your workspace</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Select a Server</h1><p className="mt-2 max-w-2xl text-sm text-white/50">Choose a community to customize music, security, commands and Delta settings.</p></div>
        <a href="https://delta-bot.online/premium" className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/15 px-4 py-2.5 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-400/25"><Sparkles className="size-4" />Premium</a>
      </div>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      {loading ? <p role="status" className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/60">Loading your servers…</p>
      : !account ? <div className="max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-7"><div className="mb-4 grid size-12 place-items-center rounded-xl bg-red-500/15"><Server className="size-6 text-red-400" /></div><h2 className="text-xl font-bold">Connect your Discord</h2><p className="mt-2 mb-6 text-sm text-white/55">Sign in to see servers you own or have permission to manage.</p><a className="inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-500" href="/api/dashboard/login">Log in with Discord</a></div>
      : <section className="rounded-[20px] border border-white/[0.07] bg-[#1a1517]/90 p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-bold">Your servers</h2><p className="mt-1 text-xs text-white/45">{account.guilds.length} manageable servers · {account.guilds.filter(g => g.available).length} ready to configure</p></div>
          <Button type="button" variant="outline" className="border-white/15 bg-white/[0.05] text-white hover:bg-white/10" onClick={() => void load()}>Refresh</Button>
        </div>
        <div className="relative mb-6 max-w-lg"><Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-white/40" /><Input aria-label="Filter servers" placeholder="Filter Server" value={serverSearch} onChange={event => setServerSearch(event.target.value)} className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-11 text-white placeholder:text-white/35" /></div>
        {!account.guilds.length && <p className="rounded-xl border border-white/10 p-6 text-sm text-white/60">No manageable servers found. You need server ownership, Administrator or Manage Server permission.</p>}
        {!ready.length && !other.length && account.guilds.length > 0 && <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">No servers match your search.</p>}
        {ready.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{ready.map(renderGuild)}</div>}
        {other.length > 0 && <div className="mt-7"><p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">Invite or reconnect · {other.length}</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{other.map(renderGuild)}</div></div>}
      </section>}
    </>}
  </DashboardShell>;
}

function GuildCard({ guild, clientId, onManage }: { guild: Guild; clientId: string; onManage: (guild: Guild) => void }) {
  const palettes = [
    "from-[#793044] via-[#ae3545] to-[#211215]",
    "from-[#9b4058] via-[#74303e] to-[#201317]",
    "from-[#764047] via-[#a14f53] to-[#28171a]",
    "from-[#8e4c2b] via-[#a13a40] to-[#261619]",
    "from-[#59313a] via-[#8c2838] to-[#221519]",
  ];
  const palette = palettes[Array.from(guild.id).reduce((n, digit) => n + (Number(digit) || 0), 0) % palettes.length];
  return <article className="group min-w-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#21191b] transition-all duration-200 hover:-translate-y-1 hover:border-white/25 hover:shadow-xl hover:shadow-black/30">
    <div className={`relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br ${palette}`}>
      <div className="pointer-events-none absolute -right-5 -top-12 size-40 rounded-full bg-white/10 blur-2xl" />
      {guild.icon ? <img alt="" width={66} height={66} className="relative size-16 rounded-full border-[3px] border-white/20 bg-[#21191b] object-cover shadow-xl" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`} /> : <span className="relative grid size-16 place-items-center rounded-full border-[3px] border-white/20 bg-white/90 text-2xl font-black text-[#5b1b27] shadow-xl">{guild.name.slice(0, 2).toUpperCase()}</span>}
      <span className="absolute right-3 top-3 rounded-full border border-black/10 bg-black/35 px-2.5 py-1 text-[10px] font-semibold text-white/90">{guild.available ? "● Ready" : "○ Offline"}</span>
    </div>
    <div className="flex min-h-[80px] items-center justify-between gap-2 p-3.5">
      <div className="min-w-0"><h3 className="truncate text-sm font-bold" title={guild.name}>{guild.name}</h3><p className="mt-1 text-xs text-white/45">{guild.role}</p></div>
      {guild.available ? <button type="button" onClick={() => onManage(guild)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-extrabold text-[#072a20] hover:bg-emerald-300"><CheckCircle2 className="size-3.5" />Go</button>
      : <a className="inline-flex shrink-0 rounded-lg bg-amber-400 px-3 py-2 text-xs font-extrabold text-[#382602] hover:bg-amber-300" href={`https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&scope=bot%20applications.commands&permissions=0&guild_id=${guild.id}&disable_guild_select=true`}>Setup</a>}
    </div>
  </article>;
}
