"use client";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { discordAvatarUrl } from "@/lib/discord-avatar";
import { Button } from "@/components/ui/button";
import { ServerConfigEditor } from "@/components/server-config-editor";
import { ArrowRight, Plus, RefreshCw, Search, Server } from "lucide-react";
import { Input } from "@/components/ui/input";

type Guild = { id: string; name: string; icon: string | null; role: string; available: boolean };
type Account = { clientId: string; user: { id: string; name: string; avatar: string | null }; guilds: Guild[] };
export default function DashboardPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Guild | null>(null);
  const [welcomeGuild, setWelcomeGuild] = useState("");
  const [busy, setBusy] = useState(false);
  const [serverSearch, setServerSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ready" | "setup">("all");
  async function load(openOverview = false) {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.status === 401) { setAccount(null); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load servers.");
      setAccount(data);
      const target = new URLSearchParams(window.location.search).get("welcome");
      if (target) {
        const guild = (data.guilds as Guild[]).find(g => g.id === target && g.available);
        if (guild) setSelected(guild);
        else setError("This server is unavailable or you do not have access.");
      } else if (openOverview && !new URLSearchParams(window.location.search).has("error")) {
        setSelected((data.guilds as Guild[]).find(guild => guild.available) ?? null);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load dashboard."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    setWelcomeGuild(new URLSearchParams(window.location.search).get("welcome") || "");
    void load(true).then(() => {
      const reason = new URLSearchParams(window.location.search).get("error");
      if (reason) setError(reason === "configuration" ? "Discord dashboard login is not configured yet." : "Discord login was cancelled or expired. Please sign in again.");
    });
  }, []);
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch("/api/dashboard/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Try again.");
      window.location.replace("/server-dashboard");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not sign out."); }
    finally { setBusy(false); }
  }
  const guilds = account?.guilds ?? [];
  const readyCount = guilds.filter(guild => guild.available).length;
  const query = serverSearch.trim().toLowerCase();
  const matches = guilds.filter(guild =>
    guild.name.toLowerCase().includes(query) &&
    (filter === "all" || guild.available === (filter === "ready"))
  ).sort((a, b) => Number(b.available) - Number(a.available) || a.name.localeCompare(b.name));
  return <DashboardShell serverOpen={!!selected} active="servers" username={account?.user.name} avatarUrl={account ? discordAvatarUrl(account.user.id, account.user.avatar) : null} onLogout={account ? () => void logout() : undefined} loggingOut={busy}>
    {selected ? <>
      {error && <p role="alert" className="mb-4 text-sm text-red-300">{error}</p>}
      <ServerConfigEditor key={selected.id} guildId={selected.id} initialSection={selected.id === welcomeGuild ? "welcome" : "overview"}
        serverNavigation={{
          current: selected,
          servers: guilds.filter(guild => guild.available),
          select: id => {
            setSelected(guilds.find(guild => guild.id === id && guild.available) ?? null);
            setWelcomeGuild("");
            window.history.replaceState(null, "", "/server-dashboard");
          },
        }} />
    </> : <>
      <header className="server-masthead mb-6">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Server directory</h1>
        <p className="mt-2 text-sm text-white/65">Choose a server to manage Delta or set up a new community.</p>
      </header>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
      {loading ? <p role="status" className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/60">Loading your servers…</p>
      : !account ? <div className="max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-7"><div className="mb-4 grid size-12 place-items-center rounded-xl bg-red-500/15"><Server className="size-6 text-red-400" /></div><h2 className="text-xl font-bold">Connect your Discord</h2><p className="mt-2 mb-6 text-sm text-white/55">Sign in to see servers you own or have permission to manage.</p><a className="inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-500" href={`/api/dashboard/login?view=server${welcomeGuild ? `&welcome=${encodeURIComponent(welcomeGuild)}` : ""}`}>Log in with Discord</a></div>
      : <section aria-label="Server directory" className="overflow-hidden rounded-2xl border border-white/10 bg-[#191517]">
        <div className="space-y-5 border-b border-white/10 bg-linear-to-br from-[#351b22] to-[#191517] p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Your servers</h2>
            <Button variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => void load()}>
              <RefreshCw aria-hidden="true" />Refresh
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by setup status">
              {([
                ["all", "All", guilds.length],
                ["ready", "Ready", readyCount],
                ["setup", "Needs setup", guilds.length - readyCount],
              ] as const).map(([id, label, count]) => (
                <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}
                  className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors ${filter === id ? "bg-[#8f2031] text-white" : "text-white/70 hover:bg-white/10"}`}>
                  {label} <span className="ml-1 text-xs tabular-nums">{count}</span>
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-60">
              <Search aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-white/55" />
              <Input type="search" aria-label="Search servers" placeholder="Search servers" value={serverSearch}
                onChange={event => setServerSearch(event.target.value)} className="h-11 border-white/15 bg-black/20 pl-10 text-white placeholder:text-white/55" />
            </div>
          </div>
        </div>
        {guilds.length === 0 ? <p className="p-6 text-sm text-white/65">No manageable servers found. You need server ownership, Administrator or Manage Server permission.</p>
          : matches.length === 0 ? <div role="status" className="p-8 text-center text-sm text-white/65">No matching servers.
            <button type="button" onClick={() => { setServerSearch(""); setFilter("all"); }} className="mx-auto mt-3 block min-h-11 px-3 font-semibold text-red-300 underline">Clear filters</button>
          </div>
          : <ul className="server-directory-grid">{matches.map(guild => <GuildRow key={guild.id} guild={guild} clientId={account.clientId} onManage={setSelected} />)}</ul>}
      </section>}
    </>}
  </DashboardShell>;
}

function GuildRow({ guild, clientId, onManage }: { guild: Guild; clientId: string; onManage: (guild: Guild) => void }) {
  const actionClass = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold";
  return (
    <li className="server-directory-card">
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-[#48232c] font-bold text-red-100">
        {guild.icon ? <img alt="" width={44} height={44} className="size-full object-cover" src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`} />
          : guild.name.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-base font-bold leading-tight">{guild.name}</h3>
        <p className="mt-1 text-xs text-white/60">{guild.role} · {guild.available ? "Ready" : "Needs setup"}</p>
      </div>
      {guild.available
        ? <button type="button" aria-label={`Manage ${guild.name}`} onClick={() => onManage(guild)} className={`${actionClass} bg-[#8f2031] text-white hover:bg-[#ab293d]`}>Manage <ArrowRight className="size-4" /></button>
        : <a aria-label={`Set up ${guild.name}`} className={`${actionClass} border border-white/15 text-white/85 hover:bg-white/10`} href={`https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&scope=bot%20applications.commands&permissions=0&guild_id=${guild.id}&disable_guild_select=true`}>Set up <Plus className="size-4" /></a>}
    </li>
  );
}
