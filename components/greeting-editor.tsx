"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultGreetings, imageUrl, IMAGE_HOSTS } from "@/lib/server-config-schema";

export type Greetings = ReturnType<typeof defaultGreetings>;
export type GuildOption = { id: string; name: string; animated?: boolean };
type Kind = "welcome" | "goodbye";
type Props = {
  value: Greetings; onChange: (settings: Greetings) => void; channels: GuildOption[];
  roles: GuildOption[]; emojis: GuildOption[]; server: string; memberCount: number; canManageRoles: boolean;
};

const selectClass = "mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function previewText(template: string, server: string, count: number, canvas: boolean) {
  const sample: Record<string, string> = { user: canvas ? "Alex" : "@Alex", username: "Alex", server, count: String(count) };
  return template.replace(/\{(user|username|server|count)\}/g, (_, key) => sample[key])
    .split(/(<a?:\w+:\d+>)/g).map((part, index) => {
      const emoji = part.match(/^<(a?):(\w+):(\d+)>$/);
      return emoji ? <img key={index} alt={`:${emoji[2]}:`} className="inline-block size-[1em] align-middle"
        src={`https://cdn.discordapp.com/emojis/${emoji[3]}.${emoji[1] && !canvas ? "gif" : "png"}`} /> : part;
    });
}

export function GreetingEditor({ value, onChange, channels, roles, emojis, server, memberCount, canManageRoles }: Props) {
  const [kind, setKind] = useState<Kind>("welcome");
  const [emojiField, setEmojiField] = useState<"message" | "canvasText">("message");
  const card = value[kind];
  const title = kind === "welcome" ? "Welcome" : "Goodbye";
  function change(patch: Partial<typeof card>) { onChange({ ...value, [kind]: { ...card, ...patch } }); }
  let background = "";
  try { background = imageUrl(card.backgroundImage); } catch { /* An incomplete URL can be edited. */ }
  return <div className="space-y-5">
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex gap-2">{(["welcome", "goodbye"] as const).map(k =>
        <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setEmojiField("message"); }}
          className={`rounded-lg border px-4 py-2 capitalize ${kind === k ? "bg-primary text-primary-foreground" : ""}`}>{k}</button>)}</div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={card.enabled} onChange={e => change({ enabled: e.target.checked })} />Enable {kind} messages</label>
      <label className="block">Delivery channel<select className={selectClass} value={card.channelId} onChange={e => change({ channelId: e.target.value })}>
        <option value="">Select a channel</option>{channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></label>
      <label className="block">Message<Textarea maxLength={2000} value={card.message} onFocus={() => setEmojiField("message")} onChange={e => change({ message: e.target.value })} /></label>
      <p className="text-sm text-muted-foreground">Use {"{user}"} to mention the member, {"{username}"} for their name, {"{server}"} for the server name and {"{count}"} for the member count.</p>
      <label className="flex items-center gap-2"><input type="checkbox" checked={card.canvas} onChange={e => { change({ canvas: e.target.checked }); setEmojiField("message"); }} />Attach a canvas image</label>
      {card.canvas && <>
        <label className="block">Canvas text<Textarea maxLength={600} rows={3} value={card.canvasText} onFocus={() => setEmojiField("canvasText")} onChange={e => change({ canvasText: e.target.value })} /></label>
        <label className="block">Background image URL<Input type="url" maxLength={2048} value={card.backgroundImage} onChange={e => change({ backgroundImage: e.target.value })} /></label>
        <p className="text-xs text-muted-foreground">Use an image from {IMAGE_HOSTS.join(", ")} or leave blank for a solid background.</p>
        <div className="flex flex-wrap gap-4">
          <label>Background color<Input type="color" value={card.backgroundColor} onChange={e => change({ backgroundColor: e.target.value })} /></label>
          <label>Text color<Input type="color" value={card.textColor} onChange={e => change({ textColor: e.target.value })} /></label>
          <label>Text size · {card.fontSize}px<Input type="range" min={16} max={80} value={card.fontSize} onChange={e => change({ fontSize: Number(e.target.value) })} /></label>
        </div>
      </>}
      {emojis.length > 0 && <label className="block">Add a server emoji to {emojiField === "message" ? "the message" : "canvas text"}
        <select value="" className={selectClass} onChange={e => {
          const emoji = emojis.find(item => item.id === e.target.value);
          if (emoji) change({ [emojiField]: card[emojiField] + `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>` });
        }}><option value="">Choose emoji</option>{emojis.map(e => <option key={e.id} value={e.id}>:{e.name}:</option>)}</select></label>}
    </section>
    <section className="space-y-3 rounded-xl border bg-card p-5" aria-label={title + " preview"}>
      <h4 className="font-semibold">{title} preview</h4>
      <div className="whitespace-pre-wrap break-words">{previewText(card.message, server, memberCount, false)}</div>
      {card.canvas && <div style={{ containerType: "inline-size" }}><div className="flex aspect-[1000/360] items-center justify-center overflow-hidden rounded-lg bg-cover bg-center text-center"
        style={{ color: card.textColor, backgroundColor: card.backgroundColor, backgroundImage: background ? `url("${background}")` : undefined }}>
        <div className="whitespace-pre" style={{ font: `${card.fontSize / 10}cqw/1.25 sans-serif` }}>{previewText(card.canvasText.split("\n").slice(0, 5).join("\n"), server, memberCount, true)}</div>
      </div></div>}
    </section>
    {canManageRoles && <section className="space-y-3 rounded-xl border bg-card p-5">
      <h4 className="font-semibold">Automatic join roles</h4>
      <p className="text-sm text-muted-foreground">Roles apply when someone joins, including when welcome messages are off.</p>
      {(["autoRole", "botRole"] as const).map(field => <label className="block" key={field}>{field === "autoRole" ? "Member role" : "Bot role"}
        <select className={selectClass} value={value[field]} onChange={e => onChange({ ...value, [field]: e.target.value })}><option value="">None</option>
          {value[field] && !roles.some(role => role.id === value[field]) && <option value={value[field]}>Role unavailable</option>}
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>)}
    </section>}
  </div>;
}
