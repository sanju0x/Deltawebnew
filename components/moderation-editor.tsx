"use client";

import { useEffect, useState } from "react";
import { Hash, Search, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ModerationConfig = {
  logChannelId: string;
  automod: {
    enabled: boolean; blockInvites: boolean; blockSpam: boolean; blockLinks: boolean;
    blockEveryone: boolean; blockDuplicates: boolean; spamMessageLimit: number;
    spamWindowSeconds: number; duplicateLimit: number; capsPercent: number; capsMinLength: number;
    mentionLimit: number; blockedWords: string[]; wordMatchMode: "contains" | "whole";
    action: string; timeoutSeconds: number; exemptChannels: string[]; exemptRoles: string[];
  };
};
type Option = { id: string; name: string };
const card = "space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6";

function NumberSetting({ id, title, value, min, max, onChange }: { id: string; title: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <div className="space-y-2"><Label htmlFor={id}>{title}</Label><Input id={id} type="number" min={min} max={max} step={1} value={draft} onChange={e => {
    setDraft(e.target.value);
    const n = Number(e.target.value);
    if (e.target.value !== "" && Number.isInteger(n) && n >= min && n <= max) onChange(n);
  }} onBlur={() => {
    const n = Number(draft);
    const next = draft.trim() && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : value;
    setDraft(String(next)); onChange(next);
  }} /></div>;
}

function Exemptions({ title, kind, options, selected, onChange }: { title: string; kind: "channels" | "roles"; options: Option[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [search, setSearch] = useState("");
  const visible = options.filter(option => option.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className={card} aria-labelledby={`exempt-${kind}-title`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h4 id={`exempt-${kind}-title`} className="font-semibold">{title}</h4><span className="text-sm text-muted-foreground">{selected.length}/100 selected</span></div>
    <p className="text-sm text-muted-foreground">{kind === "channels" ? "Messages in these channels bypass all AutoMod filters." : "Members with any of these roles bypass all AutoMod filters."}</p>
    <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label={`Search ${title.toLowerCase()}`} placeholder={`Search ${kind}…`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
    {selected.length > 0 && <div className="flex flex-wrap gap-2" aria-label={`Selected ${kind}`}>
      {selected.map(id => <button key={id} type="button" className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" aria-label={`Remove ${options.find(o => o.id === id)?.name || id} exemption`} onClick={() => onChange(selected.filter(value => value !== id))}>
        <span className="truncate">{kind === "channels" ? "#" : "@"}{options.find(o => o.id === id)?.name || `Unavailable (${id})`}</span><X aria-hidden="true" className="size-3.5 shrink-0" />
      </button>)}
      <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>Clear exemptions</Button>
    </div>}
    <div className="max-h-56 overflow-y-auto rounded-lg border border-border p-1">
      {visible.length ? visible.map(option => <label key={option.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted/50">
        <input type="checkbox" className="size-4 shrink-0 accent-red-500" checked={selected.includes(option.id)} disabled={!selected.includes(option.id) && selected.length >= 100} onChange={e => onChange(e.target.checked ? [...selected, option.id] : selected.filter(id => id !== option.id))} />
        {kind === "channels" && <Hash aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}<span className="break-all">{option.name}</span>
      </label>) : <p className="p-4 text-sm text-muted-foreground">{options.length ? "No matches. Try another search." : `No ${kind} available. Refresh after Delta syncs your server.`}</p>}
    </div>
  </section>;
}

function BlockedWords({ words, onChange }: { words: string[]; onChange: (words: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  function add() {
    const entries = draft.split(/[\n,]+/).map(word => word.trim().toLowerCase()).filter(Boolean);
    const merged = [...new Set([...words, ...entries])];
    if (entries.some(word => word.length > 64)) { setError("Each word or phrase must be 64 characters or fewer."); return; }
    if (merged.length > 100) { setError(`You can add ${100 - words.length} more entries. The limit is 100.`); return; }
    onChange(merged); setDraft(""); setError("");
  }
  const visible = words.filter(word => word.includes(search.trim().toLowerCase()));
  return <div className="space-y-4">
    <div className="space-y-2"><Label htmlFor="blocked-word-draft">Add words or phrases</Label><Textarea id="blocked-word-draft" value={draft} maxLength={6500} placeholder="Enter words or phrases, separated by commas or new lines" onChange={e => { setDraft(e.target.value); setError(""); }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); add(); } }} aria-describedby="blocked-word-help" aria-invalid={!!error} />
      <p id="blocked-word-help" className="text-sm text-muted-foreground">Press Enter or Add entries to add. Shift+Enter starts a new line. Up to 100 entries, 64 characters each. Matching ignores case.</p>
      <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{words.length}/100 entries</span><Button type="button" onClick={add} disabled={!draft.trim()}>Add entries</Button></div>
      {draft.trim() && <p role="status" className="text-sm text-amber-500">This text is a draft. Add entries before saving settings.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
    {words.length > 0 && <Input aria-label="Search blocked words" placeholder="Search blocked words…" value={search} onChange={e => setSearch(e.target.value)} />}
    <div className="flex flex-wrap gap-2" aria-label="Blocked word entries">
      {visible.map(word => <button type="button" key={word} onClick={() => onChange(words.filter(value => value !== word))} aria-label={`Remove blocked phrase: ${word}`} className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"><span className="break-all">{word}</span><X aria-hidden="true" className="size-4 shrink-0" /></button>)}
      {!visible.length && <p className="text-sm text-muted-foreground">{words.length ? "No matching entries." : "No blocked words yet. Add your first word or phrase above."}</p>}
    </div>
  </div>;
}

function RuleSwitch({ id, title, description, checked, onChange }: { id: string; title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-start justify-between gap-4"><div className="space-y-1"><Label htmlFor={id} className="text-base">{title}</Label><p className="text-sm text-muted-foreground">{description}</p></div><Switch id={id} className="mt-1 shrink-0" checked={checked} onCheckedChange={onChange} /></div>;
}

export function ModerationEditor({ value, onChange, channels, roles, disabled, section = "moderation", onNavigate }: { value: ModerationConfig; onChange: (value: ModerationConfig) => void; channels: Option[]; roles: Option[]; disabled: boolean; section?: "moderation" | "automod"; onNavigate?: (section: string) => void }) {
  const a = value.automod;
  const change = (patch: Partial<ModerationConfig["automod"]>) => onChange({ ...value, automod: { ...a, ...patch } });
  function number(key: "mentionLimit" | "spamMessageLimit" | "spamWindowSeconds" | "duplicateLimit" | "capsPercent" | "capsMinLength" | "timeoutSeconds", title: string, min: number, max: number) {
    return <NumberSetting id={`automod-${key}`} title={title} min={min} max={max} value={a[key]} onChange={value => change({ [key]: value })} />;
  }
  return <fieldset disabled={disabled} className="min-w-0 space-y-5">
    <legend className="sr-only">{section === "moderation" ? "Moderation settings" : "AutoMod settings"}</legend>
    {section === "moderation" ? <>
      <section className={card}>
        <h4 className="font-semibold">Moderation logs</h4><p className="text-sm text-muted-foreground">Keep a record of moderator commands and automatic actions in one channel. Case history is always stored in Delta.</p>
        <Label htmlFor="mod-log-channel">Log channel</Label><Select value={value.logChannelId || "none"} onValueChange={id => onChange({ ...value, logChannelId: id === "none" ? "" : id })} disabled={disabled}><SelectTrigger id="mod-log-channel" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No channel logs</SelectItem>{channels.map(c => <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>)}</SelectContent></Select>
      </section>
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold">Blocked words</h4><span className={`rounded-full px-3 py-1 text-sm ${a.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>{a.enabled ? "AutoMod enabled" : "AutoMod is off"}</span></div>
        <p className="text-sm text-muted-foreground">AutoMod checks this list and applies your selected violation action. {a.enabled ? "" : "Enable AutoMod to enforce this list."}</p>
        <BlockedWords words={a.blockedWords} onChange={blockedWords => change({ blockedWords })} />
        <div className="space-y-2"><Label htmlFor="word-match-mode">Match behavior</Label><Select value={a.wordMatchMode} onValueChange={mode => change({ wordMatchMode: mode as "contains" | "whole" })} disabled={disabled}><SelectTrigger id="word-match-mode" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="contains">Anywhere in a message</SelectItem><SelectItem value="whole">Whole words and phrases</SelectItem></SelectContent></Select><p className="text-sm text-muted-foreground">{a.wordMatchMode === "whole" ? "“cat” matches “cat!” but allows “category”. Phrases must have word boundaries at both ends." : "“cat” also matches “category”. Use whole words to reduce accidental matches."}</p></div>
        {onNavigate && <Button type="button" variant="outline" onClick={() => onNavigate("automod")}>Configure AutoMod actions</Button>}
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-2"><Exemptions title="Exempt channels" kind="channels" options={channels} selected={a.exemptChannels} onChange={exemptChannels => change({ exemptChannels })} /><Exemptions title="Exempt roles" kind="roles" options={roles} selected={a.exemptRoles} onChange={exemptRoles => change({ exemptRoles })} /></div>
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">The server owner and members with Manage Messages bypass AutoMod automatically.</div>
      <section className={card}><h4 className="font-semibold">Moderator tools</h4><p className="text-sm leading-relaxed text-muted-foreground">Use <code>/mod history</code> to review cases, <code>/mod unwarn</code> to remove a warning, <code>/mod clearwarnings</code> to clear warnings, and <code>/mod slowmode</code> to slow a busy channel. These tools also work with your server prefix.</p></section>
    </> : <>
      <section className={card}>
        <div className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-5 text-red-400" /><h4 className="font-semibold">Automatic protection</h4></div>
        <RuleSwitch id="automod-enabled" title="Enable AutoMod" description="Check new messages and apply your configured rules." checked={a.enabled} onChange={enabled => change({ enabled })} />
        {!a.enabled && <p role="status" className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-500">Protection is off. You can configure rules below, then enable AutoMod and save your changes.</p>}
        <p className="text-sm text-muted-foreground">Delta needs Manage Messages to delete violations and Moderate Members to apply timeouts. The server owner, members with Manage Messages, and configured exemptions bypass all filters.</p>
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section className={card}><h4 className="font-semibold">Links & mentions</h4>
          <RuleSwitch id="automod-invites" title="Block Discord invites" description="Remove discord.gg and Discord invite links." checked={a.blockInvites} onChange={blockInvites => change({ blockInvites })} />
          <RuleSwitch id="automod-links" title="Block web links" description="Remove messages containing http://, https:// or www. links." checked={a.blockLinks} onChange={blockLinks => change({ blockLinks })} />
          <RuleSwitch id="automod-everyone" title="Block @everyone & @here" description="Remove messages that notify the whole server or online members." checked={a.blockEveryone} onChange={blockEveryone => change({ blockEveryone })} />
          {number("mentionLimit", "Mention threshold", 0, 50)}<p className="text-sm text-muted-foreground">Triggers at this many unique user and role mentions. An everyone/here notification counts as one. Set to 0 to disable.</p>
        </section>
        <section className={card}><h4 className="font-semibold">Spam protection</h4>
          <RuleSwitch id="automod-spam" title="Block rapid messages" description="Limit how many messages a member sends in a short time." checked={a.blockSpam} onChange={blockSpam => change({ blockSpam })} />
          {(a.blockSpam || a.blockDuplicates) && <div className="grid gap-4 sm:grid-cols-2">{a.blockSpam && number("spamMessageLimit", "Message threshold", 3, 20)}{number("spamWindowSeconds", "Time window (seconds)", 1, 30)}</div>}
          <RuleSwitch id="automod-duplicates" title="Block repeated messages" description="Catch identical text from the same member, ignoring case and surrounding spaces. Uses the time window above and the latest 20 messages." checked={a.blockDuplicates} onChange={blockDuplicates => change({ blockDuplicates })} />
          {a.blockDuplicates && number("duplicateLimit", "Repeated message threshold", 2, 10)}
        </section>
        <section className={card}><h4 className="font-semibold">Excessive capitals</h4>
          <RuleSwitch id="automod-caps" title="Filter capital letters" description="Catch messages with a high proportion of uppercase letters." checked={a.capsPercent > 0} onChange={enabled => change({ capsPercent: enabled ? 70 : 0 })} />
          {a.capsPercent > 0 && <div className="grid gap-4 sm:grid-cols-2">{number("capsPercent", "Uppercase percentage", 1, 100)}{number("capsMinLength", "Minimum letters", 5, 100)}</div>}
          <p className="text-sm text-muted-foreground">Counts letters only, so numbers and punctuation do not trigger this filter.</p>
        </section>
        <section className={card}><h4 className="font-semibold">Violation action</h4>
          <Label htmlFor="automod-action">When a rule is triggered</Label><Select value={a.action} onValueChange={action => change({ action })} disabled={disabled}><SelectTrigger id="automod-action" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="delete">Delete message</SelectItem><SelectItem value="warn">Delete and record a warning</SelectItem><SelectItem value="timeout">Delete and timeout member</SelectItem></SelectContent></Select>
          {a.action === "timeout" && <><Label htmlFor="automod-duration">Timeout duration</Label><Select value={[60, 300, 600, 3600, 86400].includes(a.timeoutSeconds) ? String(a.timeoutSeconds) : "custom"} onValueChange={duration => change({ timeoutSeconds: duration === "custom" ? 900 : Number(duration) })} disabled={disabled}><SelectTrigger id="automod-duration" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="60">1 minute</SelectItem><SelectItem value="300">5 minutes</SelectItem><SelectItem value="600">10 minutes</SelectItem><SelectItem value="3600">1 hour</SelectItem><SelectItem value="86400">1 day</SelectItem><SelectItem value="custom">Custom duration</SelectItem></SelectContent></Select>{![60, 300, 600, 3600, 86400].includes(a.timeoutSeconds) && number("timeoutSeconds", "Custom duration (seconds)", 10, 2419200)}<p className="text-sm text-muted-foreground">Between 10 seconds and 28 days. Delta’s highest role must be above the member’s role.</p></>}
          <p className="text-sm text-muted-foreground">The same action applies to every filter, including blocked words. Actions are recorded in moderation case history.</p>
        </section>
      </div>
      <section className={card}><h4 className="font-semibold">Words & exemptions</h4><p className="text-sm text-muted-foreground">{a.blockedWords.length} blocked entries · {a.exemptChannels.length} exempt channels · {a.exemptRoles.length} exempt roles. Manage these lists in Moderation.</p>{onNavigate && <Button type="button" variant="outline" onClick={() => onNavigate("moderation")}>Manage words & exemptions</Button>}</section>
    </>}
  </fieldset>;
}
