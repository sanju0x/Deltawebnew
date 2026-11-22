"use client";
import { useEffect, useState } from "react";
import { Bot, ChevronDown, LayoutDashboard, ListX, Music2, ShieldAlert } from "lucide-react";
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
  const sections = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    ...(canConfigureTripwire ? [{ id: "tripwire", label: "Tripwire", icon: ShieldAlert }] : []),
    { id: "commands", label: "Command disable", icon: ListX },
    { id: "music", label: "Music source", icon: Music2 },
    { id: "bot", label: "Custom bot", icon: Bot }
  ];
  const prefix = `server-${guildId}`;
  return <div className="space-y-6">
    {loading ? <p role="status">Loading server settings…</p> : config && <>
      <div><h2 className="text-2xl font-bold">{serverName || "Server settings"}</h2><p className="mt-1 break-all text-sm text-muted-foreground">{guildId}</p></div>
      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Server settings navigation" className="h-fit rounded-sm border border-border bg-card p-3 lg:sticky lg:top-24">
          <p className="px-3 pb-3 pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Server features</p>
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={activeSection === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-sm px-3 py-3 text-left text-sm font-medium transition-colors lg:w-full ${activeSection === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              onClick={() => setActiveSection(id)}><Icon aria-hidden="true" className="size-4" />{label}</button>)}
          </div>
        </nav>
        <div className="min-w-0 space-y-5">
        {activeSection === "overview" && <section className="rounded-sm border border-border bg-card p-6">
          <h3 className="text-xl font-bold">Server overview</h3>
          <p className="mt-2 text-sm text-muted-foreground">Select a category to configure Delta for this server.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { id: "tripwire", label: "Tripwire", value: channelId ? "Enabled" : "Disabled", visible: canConfigureTripwire },
              { id: "commands", label: "Command restrictions", value: `${config.disabledCommands.length} disabled`, visible: true },
              { id: "music", label: "Music source", value: MUSIC_SOURCES.find(item => item.value === config.source)?.name || config.source, visible: true },
              { id: "bot", label: "Custom bot", value: config.customBot ? "Enabled" : "Disabled", visible: true }
            ].filter(item => item.visible).map(item => <button type="button" key={item.id} onClick={() => setActiveSection(item.id)} className="rounded-sm border border-border bg-background p-4 text-left hover:border-primary/50">
              <span className="block text-sm text-muted-foreground">{item.label}</span><strong className="mt-1 block">{item.value}</strong>
            </button>)}
          </div>
        </section>}
      {activeSection === "tripwire" && canConfigureTripwire && <fieldset disabled={busy} className="space-y-3 rounded-2xl border p-5"><legend className="px-2 font-semibold">Channel tripwire</legend>
        <p className="text-sm text-muted-foreground">Delta deletes member messages in this channel and applies the selected action.</p>
        <label className="block">Channel <select className="rounded border bg-background p-2" value={channelId} onChange={e => setChannelId(e.target.value)}><option value="">Disabled</option>{channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></label>
        <label className="block">Action <select className="rounded border bg-background p-2" disabled={!channelId} value={action} onChange={e => setAction(e.target.value)}><option value="timeout">Timeout (10 minutes)</option><option value="kick">Kick</option><option value="ban">Ban</option></select></label>
      </fieldset>}
      {activeSection === "music" && <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
        <section className="space-y-3 rounded-2xl border border-border p-5">
          <h3 className="text-lg font-semibold">Music source</h3>
          <Label htmlFor={`${prefix}-source`}>Default search provider</Label>
          <select id={`${prefix}-source`} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base" value={config.source} onChange={(event) => change({ source: event.target.value })}>
            {MUSIC_SOURCES.map((source) => <option key={source.value} value={source.value}>{source.name}</option>)}
          </select>
          <p className="text-sm text-muted-foreground">Used for music searches in this server. The provider must be enabled on Delta’s music node.</p>
        </section>
      </fieldset>}
      {activeSection === "commands" && <fieldset disabled={busy} className="disabled:opacity-70">
        <details open className="group space-y-4 rounded-sm border border-border p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <span><strong className="block text-lg">Command configuration</strong><span className="text-sm text-muted-foreground">{commands.length} commands ? {config.disabledCommands.length} disabled</span></span>
            <ChevronDown aria-hidden="true" className="size-5 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <p className="text-sm text-muted-foreground">Turn commands on or off for this server. Changes apply to prefix and slash commands.</p>
          <div className="grid gap-3 sm:grid-cols-2">{commands.map((command) => <div key={command} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 p-3">
            <Label htmlFor={`${prefix}-${command}`} className="break-all">{command}</Label>
            <Switch id={`${prefix}-${command}`} checked={!config.disabledCommands.includes(command)} onCheckedChange={(enabled) => change({ disabledCommands: enabled ? config.disabledCommands.filter((value) => value !== command) : [...config.disabledCommands, command] })} />
          </div>)}</div>
        </details>
      </fieldset>}
      {activeSection === "bot" && <fieldset disabled={busy} className="disabled:opacity-70">
        <section className="space-y-4 rounded-2xl border border-border p-5">
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
      </div>
      <div className={dirty ? "sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-xl border bg-background p-4 shadow-lg" : "flex items-center gap-3"}>
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
