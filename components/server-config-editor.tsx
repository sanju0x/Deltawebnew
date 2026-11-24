"use client";
import { useEffect, useState } from "react";
import { Bot, Check, CircleAlert, CircleCheck, Clock3, LayoutDashboard, ListX, Music2, Search, ShieldAlert, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MUSIC_SOURCES, IMAGE_HOSTS } from "@/lib/server-config-schema";

import { GreetingEditor, type Greetings, type GuildOption } from "./greeting-editor";

type ServerConfig = { greetings: Greetings; source: string; disabledCommands: string[]; customBot: boolean; nickname: string; bio: string; avatar: string; banner: string; status: string; error?: string | null; revision?: string };
function previewImage(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && IMAGE_HOSTS.includes(url.hostname) ? value : ""; }
  catch { return ""; }
}
export function ServerConfigEditor({ guildId, admin = false, initialSection = "overview" }: { guildId: string; admin?: boolean; initialSection?: string }) {
  const endpoint = `${admin ? "/api/admin/server-config" : "/api/dashboard/servers"}/${guildId}`;
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [roles, setRoles] = useState<GuildOption[]>([]);
  const [emojis, setEmojis] = useState<GuildOption[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [channels, setChannels] = useState<{id: string; name: string}[]>([]);
  const [canConfigureTripwire, setCanConfigureTripwire] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [action, setAction] = useState("timeout");
  const [savedRule, setSavedRule] = useState({ channelId: "", action: "timeout" });
  const [savedConfig, setSavedConfig] = useState<ServerConfig | null>(null);
  const ruleDirty = channelId !== savedRule.channelId || (!!channelId && action !== savedRule.action);
  function signature(value: ServerConfig | null) {
    return JSON.stringify(value && { ...value, disabledCommands: [...value.disabledCommands].sort() });
  }
  const configDirty = signature(config) !== signature(savedConfig);
  const dirty = configDirty || ruleDirty;
  const [commands, setCommands] = useState<string[]>([]);
  const [serverName, setServerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setConfig(null); setSavedConfig(null); setError(""); setNotice("");
    fetch(endpoint, { headers: { "x-editor-open": "1" }, cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load settings.");
      setRoles(data.roles || []); setEmojis(data.emojis || []); setMemberCount(data.memberCount || 0);
      setChannels(data.channels || []); setCanConfigureTripwire(data.canConfigureTripwire);
      const rule = { channelId: data.tripwire?.channelId || "", action: data.tripwire?.action || "timeout" };
      setSavedRule(rule); setChannelId(rule.channelId); setAction(rule.action);
      setConfig(data.config); setSavedConfig(data.config); setCommands(data.commands); setServerName(data.serverName);
    }).catch((e) => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [endpoint]);
  useEffect(() => {
    if (!config || busy) return;
    const controller = new AbortController();
    const timer = setInterval(async () => {
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not check sync status.");
        if (!controller.signal.aborted) {
          if (!dirty) { setConfig(data.config); setSavedConfig(data.config); }
          setRoles(data.roles || []); setChannels(data.channels || []); setEmojis(data.emojis || []);
          setMemberCount(data.memberCount || 0); setCanConfigureTripwire(data.canConfigureTripwire);
          const rule = { channelId: data.tripwire?.channelId || "", action: data.tripwire?.action || "timeout" };
          if (!dirty) { setSavedRule(rule); setChannelId(rule.channelId); setAction(rule.action); }
        }
      } catch (e) { if (!controller.signal.aborted) setNotice(e instanceof Error ? e.message : "Could not check sync status."); }
    }, 15000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [endpoint, config?.status, config?.revision, dirty, busy, loading]);
  function change(values: Partial<ServerConfig>) { setConfig((current) => current ? { ...current, ...values } : current); setNotice(""); }
  async function save() {
    if (!config || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (configDirty || (!ruleDirty && config.status === "error")) {
        const greetings = Object.fromEntries((Object.keys(config.greetings) as (keyof Greetings)[])
          .filter(key => JSON.stringify(config.greetings[key]) !== JSON.stringify(savedConfig?.greetings[key]))
          .map(key => [key, config.greetings[key]]));
        const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Config-Revision": config.revision || "initial" }, body: JSON.stringify({ ...config, greetings }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not save settings.");
        setConfig(data.config); setSavedConfig(data.config);
      }
      if (ruleDirty) {
        const response = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: channelId || null, action: channelId ? action : null }) });
        if (!response.ok) throw new Error((await response.json()).error || "Could not save tripwire.");
        setSavedRule({ channelId, action });
      }
      setNotice("Saved. Delta usually applies changes within 15 seconds.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save settings."); }
    finally { setBusy(false); }
  }
  const [activeSection, setActiveSection] = useState(initialSection);
  const [commandSearch, setCommandSearch] = useState("");
  const sections = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "welcome", label: "Welcome & goodbye", icon: Bot },
    ...(canConfigureTripwire ? [{ id: "tripwire", label: "Tripwire", icon: ShieldAlert }] : []),
    { id: "commands", label: "Command disable", icon: ListX },
    { id: "music", label: "Music source", icon: Music2 },
    { id: "bot", label: "Custom bot", icon: Bot }
  ];
  const prefix = `server-${guildId}`;
  const sectionMeta: Record<string, { title: string; subtitle: string }> = {
    overview: { title: "Server overview", subtitle: "Everything Delta can manage in your community." },
    welcome: { title: "Welcome & goodbye", subtitle: "Customize what happens when members join or leave." },
    tripwire: { title: "Tripwire protection", subtitle: "Protect your community with automated actions." },
    commands: { title: "Command management", subtitle: "Search, enable or restrict commands for this server." },
    music: { title: "Music preferences", subtitle: "Choose which supported provider Delta searches by default." },
    bot: { title: "Custom bot identity", subtitle: "Make Delta feel like part of your server." }
  };
  const visibleCommands = commands.filter(command => command.toLowerCase().includes(commandSearch.trim().toLowerCase()));
  const activeMeta = sectionMeta[activeSection] || sectionMeta.overview;
  return <div className="space-y-6">
    {loading ? <p role="status">Loading server settings…</p> : config && <>
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border/70 bg-card/70 p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-red-600/20 bg-red-600/10 text-xl font-black text-red-500">{(serverName || "D").slice(0,1).toUpperCase()}</div>
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">Delta control center</p><h2 className="mt-1 truncate text-xl font-bold sm:text-2xl">{serverName || "Server settings"}</h2><p className="mt-1 text-xs text-muted-foreground">Server ID: {guildId}</p></div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${dirty ? "border-amber-500/25 bg-amber-500/10 text-amber-500" : config.status === "pending" ? "border-blue-500/25 bg-blue-500/10 text-blue-500" : config.status === "error" ? "border-destructive/25 bg-destructive/10 text-destructive" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"}`}>
          {dirty ? <CircleAlert className="size-4" /> : config.status === "pending" ? <Clock3 className="size-4" /> : config.status === "error" ? <CircleAlert className="size-4" /> : <CircleCheck className="size-4" />}
          {dirty ? "Unsaved changes" : config.status === "pending" ? "Syncing with Delta" : config.status === "error" ? "Sync issue" : "Up to date"}
        </span>
      </div>
      <nav aria-label="Server settings sections" className="flex gap-2 overflow-x-auto rounded-xl border border-white/10 bg-[#171315] p-2">
        {sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveSection(id)} aria-current={activeSection === id ? "page" : undefined}
          className={`inline-flex min-h-11 shrink-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${activeSection === id ? "bg-gradient-to-r from-[#841627] to-[#bd2639] text-white shadow-lg shadow-red-950/40" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
          <Icon aria-hidden="true" className="size-4" />{label}</button>)}
      </nav>
      <div className="space-y-5">
        <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-lg border border-red-900/40 bg-red-950/30"><Settings2 className="size-5 text-red-400" /></div>
          <div><h3 className="text-xl font-bold">{activeMeta.title}</h3><p className="text-sm text-white/45">{activeMeta.subtitle}</p></div></div>
        {activeSection === "overview" && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
          <section className="rounded-xl border border-white/10 bg-[#191517] p-5 sm:p-6">
            <h4 className="text-lg font-bold">Server information</h4>
            <p className="mt-1 text-sm text-white/45">Manage server-specific settings without leaving the dashboard.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-[#251b1e] p-4"><p className="text-xs text-white/50">Server name</p><p className="mt-2 break-words font-semibold">{serverName || "Delta Server"}</p></div>
              <div className="rounded-lg border border-white/10 bg-[#251b1e] p-4"><p className="text-xs text-white/50">Server ID</p><p className="mt-2 break-all font-mono text-sm">{guildId}</p></div>
            </div>
            <h4 className="mt-7 text-lg font-bold">Setup & features</h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { id: "tripwire", label: "Tripwire protection", value: channelId ? "On" : "Off", visible: canConfigureTripwire },
                { id: "commands", label: "Command restrictions", value: `${config.disabledCommands.length} disabled`, visible: true },
                { id: "music", label: "Music provider", value: MUSIC_SOURCES.find(item => item.value === config.source)?.name || config.source, visible: true },
                { id: "bot", label: "Custom bot", value: config.customBot ? "On" : "Off", visible: true }
              ].filter(item => item.visible).map(item => <button key={item.id} type="button" onClick={() => setActiveSection(item.id)} className="rounded-xl border border-white/10 bg-[#251b1e] p-4 text-left transition-colors hover:border-red-500/50 hover:bg-[#302025]">
                <span className="block text-xs text-white/50">{item.label}</span><strong className="mt-2 block text-base">{item.value}</strong><span className="mt-3 block text-xs font-semibold text-red-400">Configure →</span>
              </button>)}
            </div>
          </section>
          <aside className="space-y-5">
            <section className="rounded-xl border border-white/10 bg-[#191517] p-5">
              <h4 className="font-bold">Setup status</h4>
              <p className="mt-2 text-sm text-white/50">{dirty ? "Changes are waiting to be saved." : config.status === "pending" ? "Delta is syncing your settings." : config.status === "error" ? "The last update needs attention." : "Your saved configuration is up to date."}</p>
            </section>
            <section className="rounded-xl border border-white/10 bg-[#191517] p-5">
              <h4 className="font-bold">Recommended setup</h4>
              <p className="mt-1 text-xs text-white/45">Optional features you can configure.</p>
              <div className="mt-4 divide-y divide-white/10">
                {[
                  { id: "tripwire", title: "Tripwire", desc: "Protect a selected channel", active: !!channelId, visible: canConfigureTripwire },
                  { id: "bot", title: "Custom bot", desc: "Personalize the bot profile", active: config.customBot, visible: true },
                  { id: "commands", title: "Command restrictions", desc: "Control available commands", active: config.disabledCommands.length > 0, visible: true }
                ].filter(item => item.visible).map(item => <button key={item.id} type="button" onClick={() => setActiveSection(item.id)} className="flex w-full items-center justify-between gap-3 py-4 text-left hover:text-red-300">
                  <span><strong className="block text-sm">{item.title}</strong><small className="mt-1 block text-xs text-white/45">{item.desc}</small></span>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${item.active ? "bg-emerald-400/10 text-emerald-400" : "bg-white/10 text-white/50"}`}>{item.active ? "On" : "Off"}</span>
                </button>)}
              </div>
            </section>
          </aside>
        </div>}
      {activeSection === "tripwire" && canConfigureTripwire && <fieldset disabled={busy} className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6"><legend className="px-2 font-semibold">Channel tripwire</legend>
        <p className="text-sm text-muted-foreground">Delta deletes member messages in this channel and applies the selected action.</p>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-tripwire-channel`}>Channel</Label>
          <Select value={channelId || "off"} onValueChange={value => setChannelId(value === "off" ? "" : value)} disabled={busy}>
            <SelectTrigger id={`${prefix}-tripwire-channel`} className="h-12 w-full rounded-xl border-white/15 bg-[#211719] px-4 text-white shadow-sm transition-colors hover:border-red-500/40 focus-visible:border-red-500 focus-visible:ring-red-500/20">
              <SelectValue placeholder="Select a channel" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[70] max-h-72 rounded-xl border border-red-900/35 bg-[#1b1517] p-1 text-white shadow-[0_20px_50px_rgba(0,0,0,.55)]">
              <SelectItem value="off" className="min-h-10 rounded-lg text-white/75 focus:bg-red-900/35 focus:text-white">Disabled</SelectItem>
              {channels.map(channel => <SelectItem key={channel.id} value={channel.id} className="min-h-10 rounded-lg text-white/85 focus:bg-red-900/35 focus:text-white">#{channel.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-tripwire-action`}>Action</Label>
          <Select value={action} onValueChange={setAction} disabled={busy || !channelId}>
            <SelectTrigger id={`${prefix}-tripwire-action`} className="h-12 w-full rounded-xl border-white/15 bg-[#211719] px-4 text-white shadow-sm transition-colors hover:border-red-500/40 focus-visible:border-red-500 focus-visible:ring-red-500/20">
              <SelectValue placeholder="Choose an action" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[70] rounded-xl border border-red-900/35 bg-[#1b1517] p-1 text-white shadow-[0_20px_50px_rgba(0,0,0,.55)]">
              <SelectItem value="timeout" className="min-h-10 rounded-lg focus:bg-red-900/35 focus:text-white">Timeout (10 minutes)</SelectItem>
              <SelectItem value="kick" className="min-h-10 rounded-lg focus:bg-red-900/35 focus:text-white">Kick</SelectItem>
              <SelectItem value="ban" className="min-h-10 rounded-lg focus:bg-red-900/35 focus:text-white">Ban</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </fieldset>}
      {activeSection === "welcome" && <fieldset disabled={busy}><GreetingEditor value={config.greetings} onChange={greetings => change({ greetings })}
        channels={channels} roles={roles} emojis={emojis} server={serverName} memberCount={memberCount} canManageRoles={canConfigureTripwire} /></fieldset>}
      {activeSection === "music" && <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h4 className="text-lg font-semibold">Default music source</h4>
          <p className="mt-1 text-sm text-muted-foreground">Choose a source for music searches. Your music node must support the provider you select.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {MUSIC_SOURCES.map(source => <label key={source.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${config.source === source.value ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"}`}>
              <input type="radio" name={`${prefix}-source`} checked={config.source === source.value} onChange={() => change({source: source.value})} className="accent-red-600" />
              <Music2 className="size-4 shrink-0 text-muted-foreground" /><span className="flex-1 text-sm font-medium">{source.name}</span>
              {config.source === source.value && <Check className="size-4 text-primary" />}
            </label>)}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">A music source is required by the current bot configuration. This setting selects the default provider; it does not disable music playback.</p>
        </div>
      </fieldset>}
      {activeSection === "commands" && <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h4 className="text-lg font-semibold">Available commands</h4><p className="mt-1 text-sm text-muted-foreground">{commands.length} total · {config.disabledCommands.length} disabled · {commands.length - config.disabledCommands.length} enabled</p></div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={!commands.length} onClick={() => change({disabledCommands: []})}>Enable all</Button>
              <Button type="button" variant="outline" size="sm" disabled={!commands.length} onClick={() => change({disabledCommands: [...commands]})}>Disable all</Button>
            </div>
          </div>
          <div className="relative mt-5">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input aria-label="Search commands" placeholder="Search commands..." value={commandSearch} onChange={event => setCommandSearch(event.target.value)} className="pl-10" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Changes affect both slash and prefix commands. Turn a switch off to disable a command.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {visibleCommands.map(command => {
              const enabled = !config.disabledCommands.includes(command);
              return <div key={command} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 bg-background p-3.5 transition-colors hover:border-primary/30">
                <div className="min-w-0"><Label htmlFor={`${prefix}-${command}`} className="block truncate font-medium">{command}</Label><span className={`text-xs ${enabled ? "text-emerald-500" : "text-muted-foreground"}`}>{enabled ? "Enabled" : "Disabled"}</span></div>
                <Switch id={`${prefix}-${command}`} checked={enabled} onCheckedChange={value => change({disabledCommands: value ? config.disabledCommands.filter(item => item !== command) : [...config.disabledCommands, command]})} />
              </div>;
            })}
          </div>
          {!visibleCommands.length && <p className="mt-5 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No commands match your search.</p>}
        </div>
      </fieldset>}
      {activeSection === "bot" && <fieldset disabled={busy} className="disabled:opacity-70">
        <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4"><div><h3 className="text-lg font-semibold">Custom bot profile</h3><p className="mt-1 text-sm text-muted-foreground">Personalize Delta in this server.</p></div>
            <Switch id={`${prefix}-custom`} aria-label="Enable custom bot profile" checked={config.customBot} onCheckedChange={(customBot) => change({ customBot })} /></div>
          <p className="text-sm text-muted-foreground">Turning this off removes Delta’s custom nickname, bio, avatar and banner in this server.</p>
          {config.customBot && <div className="space-y-4">
            <div aria-label="Server profile preview" className="overflow-hidden rounded-xl border bg-card">
              <div className="h-24 bg-secondary">{previewImage(config.banner) && <img alt="Banner preview" src={config.banner} className="h-full w-full object-cover" />}</div>
              <div className="space-y-2 px-5 pb-5"><img alt="Bot avatar preview" className="-mt-7 relative size-16 rounded-full border-4 border-card bg-card object-cover" src={previewImage(config.avatar) || "/icon.svg"} />
                <strong>{config.nickname || "Delta"}</strong><p className="whitespace-pre-wrap break-words text-sm">{config.bio}</p></div>
            </div>
            <div className="space-y-2"><Label htmlFor={`${prefix}-nickname`}>Nickname</Label><Input id={`${prefix}-nickname`} maxLength={32} value={config.nickname} placeholder="Delta Music" onChange={(e) => change({ nickname: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor={`${prefix}-bio`}>Bio</Label><Textarea id={`${prefix}-bio`} maxLength={190} value={config.bio} placeholder="Music and moderation for this server." onChange={(e) => change({ bio: e.target.value })} /><p className="text-sm text-muted-foreground">{config.bio.length}/190 characters</p></div>
            {(["avatar", "banner"] as const).map((field) => <div key={field} className="space-y-2"><Label htmlFor={`${prefix}-${field}`}>{field === "avatar" ? "Avatar" : "Banner"} image link</Label><Input id={`${prefix}-${field}`} type="url" maxLength={2048} value={config[field]} placeholder="https://cdn.discordapp.com/attachments/…" onChange={(e) => change({ [field]: e.target.value })} /></div>)}
            <p className="text-sm text-muted-foreground">Use a direct HTTPS PNG, JPEG, GIF or WebP link, up to 8 MB. Supported hosts: {IMAGE_HOSTS.join(", ")}. Leave a field blank to reset it.</p>
          </div>}
        </section>
      </fieldset>}
      </div>
      <p role="status" aria-live="polite" className="mt-5 text-sm text-muted-foreground">{dirty ? "You have unsaved changes." : config.status === "pending" ? "Pending — waiting for Delta to apply your settings." : config.status === "error" ? "Some settings could not be applied. Save again to retry." : "Settings applied."}</p>
      {(dirty || config.status === "error") && <div role="region" aria-label="Save server settings" className="fixed bottom-24 left-3 right-3 z-40 mx-auto max-w-xl rounded-2xl border border-red-500/30 bg-[#211719]/95 p-4 text-white shadow-[0_18px_65px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:left-6 sm:right-6 lg:bottom-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-sm font-semibold">{dirty ? "Unsaved changes" : "Settings need attention"}</p><p className="mt-1 text-xs text-white/60">{dirty ? "Save or reset your changes." : "Retry saving to apply settings."}</p></div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" disabled={busy || !dirty} onClick={() => {
              setConfig(savedConfig); setChannelId(savedRule.channelId); setAction(savedRule.action);
              setError(""); setNotice("");
            }}>Reset</Button>
            <Button disabled={busy || (!dirty && config.status !== "error")} onClick={() => void save()}>{busy ? "Saving…" : "Save Changes"}</Button>
          </div>
        </div>
      </div>}
      {!dirty && config.error && <p role="alert" className="text-sm text-destructive">{config.error}</p>}
    </>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
