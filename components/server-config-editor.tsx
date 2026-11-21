"use client";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MUSIC_SOURCES, IMAGE_HOSTS } from "@/lib/server-config-schema";

type ServerConfig = { source: string; disabledCommands: string[]; customBot: boolean; nickname: string; bio: string; avatar: string; banner: string; status: string; error?: string | null; revision?: string };
export function ServerConfigEditor({ guildId, admin = false }: { guildId: string; admin?: boolean }) {
  const endpoint = `${admin ? "/api/admin/server-config" : "/api/dashboard/servers"}/${guildId}`;
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [commands, setCommands] = useState<string[]>([]);
  const [serverName, setServerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setConfig(null); setDirty(false); setError(""); setNotice("");
    fetch(endpoint, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load settings.");
      setConfig(data.config); setCommands(data.commands); setServerName(data.serverName);
    }).catch((e) => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [endpoint]);
  useEffect(() => {
    if (config?.status !== "pending" || dirty) return;
    const controller = new AbortController();
    const timer = setInterval(async () => {
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not check sync status.");
        // Preserve local edits and only accept status for the saved revision.
        setConfig((current) => {
          if (!current || current.revision !== data.config.revision) return current;
          return { ...current, status: data.config.status, error: data.config.error };
        });
      } catch (e) { if (!controller.signal.aborted) setNotice(e instanceof Error ? e.message : "Could not check sync status."); }
    }, 15000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [endpoint, config?.status, config?.revision, dirty]);
  function change(values: Partial<ServerConfig>) { setConfig((current) => current ? { ...current, ...values } : current); setDirty(true); setNotice(""); }
  async function save() {
    if (!config || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save settings.");
      setConfig(data.config); setDirty(false); setNotice("Saved. Delta usually applies changes within 15 seconds.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save settings."); }
    finally { setBusy(false); }
  }
  const prefix = `server-${guildId}`;
  return <div className="space-y-6">
    {loading ? <p role="status">Loading server settings…</p> : config && <>
      <div><h2 className="text-2xl font-bold">{serverName || "Server settings"}</h2><p className="mt-1 break-all text-sm text-muted-foreground">{guildId}</p></div>
      <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
        <section className="space-y-3 rounded-2xl border border-border p-5">
          <h3 className="text-lg font-semibold">Music source</h3>
          <Label htmlFor={`${prefix}-source`}>Default search provider</Label>
          <select id={`${prefix}-source`} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base" value={config.source} onChange={(event) => change({ source: event.target.value })}>
            {MUSIC_SOURCES.map((source) => <option key={source.value} value={source.value}>{source.name}</option>)}
          </select>
          <p className="text-sm text-muted-foreground">Used for music searches in this server. The provider must be enabled on Delta’s music node.</p>
        </section>
        <details className="group space-y-4 rounded-sm border border-border p-5">
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
        <section className="space-y-4 rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between gap-4"><div><h3 className="text-lg font-semibold">Custom bot profile</h3><p className="mt-1 text-sm text-muted-foreground">Personalize Delta in this server.</p></div>
            <Switch id={`${prefix}-custom`} aria-label="Enable custom bot profile" checked={config.customBot} onCheckedChange={(customBot) => change({ customBot })} /></div>
          <p className="text-sm text-muted-foreground">Turning this off removes Delta’s custom nickname, bio, avatar and banner in this server.</p>
          {config.customBot && <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor={`${prefix}-nickname`}>Nickname</Label><Input id={`${prefix}-nickname`} maxLength={32} value={config.nickname} placeholder="Delta Music" onChange={(e) => change({ nickname: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor={`${prefix}-bio`}>Bio</Label><Textarea id={`${prefix}-bio`} maxLength={190} value={config.bio} placeholder="Music and moderation for this server." onChange={(e) => change({ bio: e.target.value })} /><p className="text-sm text-muted-foreground">{config.bio.length}/190 characters</p></div>
            {(["avatar", "banner"] as const).map((field) => <div key={field} className="space-y-2"><Label htmlFor={`${prefix}-${field}`}>{field === "avatar" ? "Avatar" : "Banner"} image link</Label><Input id={`${prefix}-${field}`} type="url" maxLength={2048} value={config[field]} placeholder="https://cdn.discordapp.com/attachments/…" onChange={(e) => change({ [field]: e.target.value })} /></div>)}
            <p className="text-sm text-muted-foreground">Use a direct HTTPS PNG, JPEG, GIF or WebP link, up to 8 MB. Supported hosts: {IMAGE_HOSTS.join(", ")}. Leave a field blank to reset it.</p>
          </div>}
        </section>
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p role="status" className="text-sm text-muted-foreground">{dirty ? "You have unsaved changes." : config.status === "pending" ? "Pending — waiting for Delta to apply your settings." : config.status === "error" ? "Some settings could not be applied. Save again to retry." : "Settings applied."}</p>
        <Button disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save settings"}</Button>
      </div>
      {!dirty && config.error && <p role="alert" className="text-sm text-destructive">{config.error}</p>}
    </>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
