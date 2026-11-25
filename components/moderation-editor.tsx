"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
export type ModerationConfig = {
  logChannelId: string;
  automod: { enabled: boolean; blockInvites: boolean; blockSpam: boolean; mentionLimit: number; blockedWords: string[]; action: string; timeoutSeconds: number; exemptChannels: string[]; exemptRoles: string[] };
};
type Option = { id: string; name: string };
export function ModerationEditor({ value, onChange, channels, roles, disabled }: { value: ModerationConfig; onChange: (value: ModerationConfig) => void; channels: Option[]; roles: Option[]; disabled: boolean }) {
  const a = value.automod;
  const change = (patch: Partial<ModerationConfig["automod"]>) => onChange({ ...value, automod: { ...a, ...patch } });
  const selectClass = "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm";
  return <fieldset disabled={disabled} className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6">
    <legend className="px-2 font-semibold">Moderation & automod</legend>
    <p className="text-sm text-muted-foreground">Manage automatic protection and audit logs. Members with Manage Messages and the server owner are exempt. Delta needs Manage Messages to delete violations and Moderate Members to apply timeouts.</p>
    <div className="space-y-2"><Label htmlFor="mod-log-channel">Moderation log channel</Label>
      <select id="mod-log-channel" className={selectClass} value={value.logChannelId} onChange={e => onChange({ ...value, logChannelId: e.target.value })}>
        <option value="">No channel logs</option>{channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
      </select><p className="text-sm text-muted-foreground">Moderation commands and automod send case logs here. Case history stays in the bot database.</p>
    </div>
    {([{ key: "enabled", label: "Enable automod" }, { key: "blockInvites", label: "Block Discord invite links" }, { key: "blockSpam", label: "Block spam (6 messages in 5 seconds)" }] as const).map(({key,label}) => <div key={key} className="flex items-center justify-between gap-4"><Label htmlFor={`automod-${key}`}>{label}</Label><Switch id={`automod-${key}`} checked={a[key]} onCheckedChange={checked => change({ [key]: checked })} /></div>)}
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="automod-mentions">Mention threshold (0 disables)</Label><Input id="automod-mentions" type="number" min={0} max={50} value={a.mentionLimit} onChange={e => change({ mentionLimit: Number(e.target.value) })} /></div>
      <div className="space-y-2"><Label htmlFor="automod-action">Violation action</Label><select id="automod-action" className={selectClass} value={a.action} onChange={e => change({ action: e.target.value })}><option value="delete">Delete message</option><option value="warn">Delete and warn</option><option value="timeout">Delete and timeout</option></select></div>
      {a.action === "timeout" && <div className="space-y-2"><Label htmlFor="automod-timeout">Timeout duration (seconds)</Label><Input id="automod-timeout" type="number" min={10} max={2419200} value={a.timeoutSeconds} onChange={e => change({ timeoutSeconds: Number(e.target.value) })} /></div>}
    </div>
    <div className="space-y-2"><Label htmlFor="automod-words">Blocked words or phrases (one per line)</Label><Textarea id="automod-words" maxLength={6500} value={a.blockedWords.join("\n")} onChange={e => change({ blockedWords: e.target.value.split("\n") })} onBlur={() => change({ blockedWords: a.blockedWords.map(w => w.trim()).filter(Boolean) })} /><p className="text-sm text-muted-foreground">Matches text anywhere in a message, ignoring case. Up to 100 entries, 64 characters each.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">{([{ key: "exemptChannels", title: "Exempt channels", options: channels }, { key: "exemptRoles", title: "Exempt roles", options: roles }] as const).map(({key,title,options}) => <div key={key} className="space-y-2"><Label htmlFor={`automod-${key}`}>{title}</Label><select multiple id={`automod-${key}`} className="min-h-32 w-full rounded-lg border border-border bg-background p-2 text-sm" value={a[key]} onChange={e => change({ [key]: Array.from(e.target.selectedOptions, o => o.value) })}>{options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select><p className="text-sm text-muted-foreground">Hold Ctrl or Command to select multiple entries.</p></div>)}</div>
    <div className="rounded-lg bg-muted/40 p-4 text-sm leading-relaxed"><strong>Moderator tools</strong><p>Use <code>/mod slowmode</code>, <code>/mod history</code>, <code>/mod unwarn</code> and <code>/mod clearwarnings</code>. The same actions work with the server prefix, for example <code>mod slowmode 10</code>. Existing ban, kick, timeout and warning commands remain available.</p></div>
  </fieldset>;
}
