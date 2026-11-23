"use client";
import { useEffect, useState } from "react";
import { Bot, Check, CircleAlert, CircleCheck, Clock3, LayoutDashboard, ListX, Music2, Search, ShieldAlert, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MUSIC_SOURCES, IMAGE_HOSTS } from "@/lib/server-config-schema";

type ServerConfig = { source: string; disabledCommands: string[]; customBot: boolean; nickname: string; bio: string; avatar: string; banner: string; status: string; error?: string | null; revision?: string };
function previewImage(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && IMAGE_HOSTS.includes(url.hostname) ? value : ""; }
  catch { return ""; }
}
export function ServerConfigEditor({ guildId, admin = false }: { guildId: string; admin?: boolean }) {
  const endpoint = `${admin ? "/api/admin/server-config" : "/api/dashboard/servers"}/${guildId}`;
  const [config, setConfig] = useState<ServerConfig | null>(null);
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
      setChannels(data.channels || []); setCanConfigureTripwire(data.canConfigureTripwire);
      const rule = { channelId: data.tripwire?.channelId || "", action: data.tripwire?.action || "timeout" };
      setSavedRule(rule); setChannelId(rule.channelId); setAction(rule.action);
      setConfig(data.config); setSavedConfig(data.config); setCommands(data.commands); setServerName(data.serverName);
    }).catch((e) => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [endpoint]);
  useEffect(() => {
    if (!config || dirty || busy) return;
    const controller = new AbortController();
    const timer = setInterval(async () => {
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not check sync status.");
        if (!controller.signal.aborted) {
          setConfig(data.config); setSavedConfig(data.config);
          const rule = { channelId: data.tripwire?.channelId || "", action: data.tripwire?.action || "timeout" };
          setSavedRule(rule); setChannelId(rule.channelId); setAction(rule.action);
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
        const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Config-Revision": config.revision || "initial" }, body: JSON.stringify(config) });
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
  const [activeSection, setActiveSection] = useState("overview");
  const [commandSearch, setCommandSearch] = useState("");
  const sections = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    ...(canConfigureTripwire ? [{ id: "tripwire", label: "Tripwire", icon: ShieldAlert }] : []),
    { id: "commands", label: "Command disable", icon: ListX },
    { id: "music", label: "Music source", icon: Music2 },
    { id: "bot", label: "Custom bot", icon: Bot }
  ];
  const prefix = `server-${guildId}`;
  const sectionMeta: Record<string, { title: string; subtitle: string }> = {
    overview: { title: "Server overview", subtitle: "Everything Delta can manage in your community." },
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
        {activeSection === "overview" && <section className="rounded-sm border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Select a feature below to open its controls. No changes are applied until you save them.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { id: "tripwire", label: "Tripwire", value: channelId ? "Enabled" : "Disabled", visible: canConfigureTripwire },
              { id: "commands", label: "Command restrictions", value: `${config.disabledCommands.length} disabled`, visible: true },
              { id: "music", label: "Music source", value: MUSIC_SOURCES.find(item => item.value === config.source)?.name || config.source, visible: true },
              { id: "bot", label: "Custom bot", value: config.customBot ? "Enabled" : "Disabled", visible: true }
            ].filter(item => item.visible).map(item => <button type="button" key={item.id} onClick={() => setActiveSection(item.id)} className="group rounded-lg border border-border bg-background p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</span><strong className="mt-2 block text-lg">{item.value}</strong><span className="mt-3 block text-xs text-primary opacity-80 group-hover:opacity-100">Configure →</span>
            </button>)}
          </div>
        </section>}
      {activeSection === "tripwire" && canConfigureTripwire && <fieldset disabled={busy} className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6"><legend className="px-2 font-semibold">Channel tripwire</legend>
        <p className="text-sm text-muted-foreground">Delta deletes member messages in this channel and applies the selected action.</p>
        <label className="block space-y-2 text-sm font-medium">Channel <select className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3" value={channelId} onChange={e => setChannelId(e.target.value)}><option value="">Disabled</option>{channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></label>
        <label className="block space-y-2 text-sm font-medium">Action <select className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3" disabled={!channelId} value={action} onChange={e => setAction(e.target.value)}><option value="timeout">Timeout (10 minutes)</option><option value="kick">Kick</option><option value="ban">Ban</option></select></label>
      </fieldset>}
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
      <div className={dirty || config.status === "error" ? "sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-background/95 p-4 shadow-xl backdrop-blur" : "flex items-center gap-3"}>
        <p role="status" className="text-sm text-muted-foreground">{dirty ? "You have unsaved changes." : config.status === "pending" ? "Pending — waiting for Delta to apply your settings." : config.status === "error" ? "Some settings could not be applied. Save again to retry." : "Settings applied."}</p>
        {dirty && <Button variant="outline" disabled={busy} onClick={() => {
          setConfig(savedConfig); setChannelId(savedRule.channelId); setAction(savedRule.action);
          setError(""); setNotice("");
        }}>Reset</Button>}
        {(dirty || config.status === "error") && <Button disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save Changes"}</Button>}
      </div>
      {!dirty && config.error && <p role="alert" className="text-sm text-destructive">{config.error}</p>}
    </>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
