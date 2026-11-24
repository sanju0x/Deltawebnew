"use client";
import { useRef, useState, type ReactNode } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
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

function Picker({ label, value, items, pick, placeholder }: { label: string; value: string; placeholder?: string;
  items: { id: string; name: string; image?: string }[]; pick: (id: string) => void }) {
  return <div className="space-y-1 text-sm"><span>{label}</span><Select value={value} onValueChange={pick}>
    <SelectTrigger aria-label={label} className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>{items.map(item => <SelectItem key={item.id} value={item.id} textValue={item.name}>
      {item.image && <img alt="" src={item.image} loading="lazy" className="inline-block size-6 object-contain" />} {item.name}
    </SelectItem>)}</SelectContent></Select></div>;
}
function Palette({ label, value, pick }: { label: string; value: string; pick: (color: string) => void }) {
  return <fieldset className="space-y-2 rounded-lg border px-3 pb-3"><legend className="px-1 text-sm">{label}</legend>
    <div className="flex flex-wrap gap-2">{["#182032", "#ffffff", "#5865f2", "#93c5fd", "#53dbac", "#ffb86b", "#f48fb1"].map(color =>
      <button type="button" key={color} aria-label={label + " " + color} aria-pressed={value === color} onClick={() => pick(color)}
        className="size-6 rounded-full border aria-pressed:ring-2 aria-pressed:ring-ring aria-pressed:ring-offset-2" style={{ backgroundColor: color }} />)}</div>
    <label className="flex items-center gap-2 font-mono text-xs"><input aria-label={"Custom " + label} type="color" value={value}
      onChange={e => pick(e.target.value)} className="h-7 w-9 cursor-pointer" />{value.toUpperCase()}</label></fieldset>;
}
type Layer = "avatar" | "text";
function CanvasLayer({ layer, card, move, children }: { layer: Layer; card: Greetings["welcome"];
  move: (layer: Layer, x: number, y: number) => void; children: ReactNode }) {
  const origin = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const left = card[`${layer}X`], top = card[`${layer}Y`];
  return <button type="button" aria-label={"Move " + layer} className="absolute -translate-x-1/2 -translate-y-1/2 touch-none cursor-move select-none hover:outline focus-visible:outline"
    style={{ left: left + "%", top: top + "%", width: layer === "avatar" ? "14%" : "max-content" }}
    onPointerDown={e => { origin.current = { x: e.clientX, y: e.clientY, left, top }; e.currentTarget.setPointerCapture(e.pointerId); }}
    onPointerMove={e => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const rect = e.currentTarget.parentElement!.getBoundingClientRect(), start = origin.current;
      move(layer, start.left + 100 * (e.clientX - start.x) / rect.width, start.top + 100 * (e.clientY - start.y) / rect.height);
    }}
    onKeyDown={e => {
      const steps: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (steps[e.key]) { e.preventDefault(); const [x, y] = steps[e.key]; move(layer, left + x, top + y); }
    }}>{children}</button>;
}
function previewText(template: string, server: string, count: number, canvas: boolean) {
  const suffix = count % 100 >= 11 && count % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][count % 10] || "th");
  const sample: Record<string, string> = { user: canvas ? "Alex" : "@Alex", username: "Alex", server, count: String(count),
    memberpositions: count + suffix, userid: "123456789012345678" };
  return template.replace(/\{(user|username|server|count|memberpositions|userid)\}/g, (_, key) => sample[key]).slice(0, canvas ? 600 : 2000)
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
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLTextAreaElement>(null);
  function insert(token: string) {
    const input = (emojiField === "message" ? messageRef : canvasRef).current;
    if (!input) return;
    const start = input.selectionStart, end = input.selectionEnd;
    const next = input.value.slice(0, start) + token + input.value.slice(end);
    if (next.length > input.maxLength) return;
    change({ [emojiField]: next });
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start + token.length, start + token.length); });
  }
  function move(layer: Layer, x: number, y: number) {
    const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
    change({ [`${layer}X`]: clamp(x), [`${layer}Y`]: clamp(y) });
  }
  let background = "";
  try { background = imageUrl(card.backgroundImage); } catch { /* An incomplete URL can be edited. */ }
  return <div className="space-y-5">
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex gap-2">{(["welcome", "goodbye"] as const).map(k =>
        <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setEmojiField("message"); }}
          className={`rounded-lg border px-4 py-2 capitalize ${kind === k ? "bg-primary text-primary-foreground" : ""}`}>{k}</button>)}</div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={card.enabled} onChange={e => change({ enabled: e.target.checked })} />Enable {kind} messages</label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Picker label="Delivery channel" value={card.channelId || "none"} pick={id => change({ channelId: id === "none" ? "" : id })}
          items={[{ id: "none", name: "Select a channel" }, ...channels.map(c => ({ ...c, name: "#" + c.name }))]} />
        <Picker label="Message format" value={card.format} pick={format => change({ format })} items={[
          { id: "components", name: "Embed (Components V2)" }, { id: "embed", name: "Embed (classic)" }, { id: "plain", name: "Plain message" }]} />
      </div>
      <label className="block">Message<Textarea ref={messageRef} maxLength={2000} value={card.message} onFocus={() => setEmojiField("message")} onChange={e => change({ message: e.target.value })} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={card.canvas} onChange={e => { change({ canvas: e.target.checked }); setEmojiField("message"); }} />Attach a canvas image</label>
      {card.canvas && <>
        <label className="block">Canvas text<Textarea ref={canvasRef} maxLength={600} rows={3} value={card.canvasText} onFocus={() => setEmojiField("canvasText")} onChange={e => change({ canvasText: e.target.value })} /></label>
        <label className="block">Background image URL<Input type="url" maxLength={2048} value={card.backgroundImage} onChange={e => change({ backgroundImage: e.target.value })} /></label>
        <p className="text-xs text-muted-foreground">Use an image from {IMAGE_HOSTS.join(", ")} or leave blank for a solid background.</p>
        <label className="flex items-center gap-2"><input type="checkbox" checked={card.avatar} onChange={e => change({ avatar: e.target.checked })} />Show member avatar</label>
        {card.avatar && <Picker label="Avatar shape" value={card.avatarShape} pick={avatarShape => change({ avatarShape })}
          items={[{ id: "circle", name: "Circle" }, { id: "square", name: "Square" }]} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <Palette label="Background color" value={card.backgroundColor} pick={backgroundColor => change({ backgroundColor })} />
          <Palette label="Text color" value={card.textColor} pick={textColor => change({ textColor })} />
        </div>
        <label>Text size · {card.fontSize}px<Input type="range" min={16} max={80} value={card.fontSize} onChange={e => change({ fontSize: Number(e.target.value) })} /></label>
      </>}
      <div className="space-y-2"><p className="text-sm">Insert into {emojiField === "message" ? "message" : "canvas text"}</p>
        <div className="flex flex-wrap gap-2">{["user", "username", "server", "count", "memberpositions", "userid"].map(token =>
          <button key={token} type="button" className="rounded border px-2 py-1 font-mono text-xs hover:bg-muted"
            onClick={() => insert("{" + token + "}")}>{"{" + token + "}"}</button>)}</div>
        <p className="text-xs text-muted-foreground">{"{memberpositions}"} shows the current member count as an ordinal, such as 21st.</p>
        {emojis.length > 0 && <Picker label="Server emoji" placeholder="Choose an emoji" value="" items={emojis.map(e => ({ id: e.id, name: `:${e.name}:`,
          image: `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? "gif" : "png"}` }))} pick={id => {
          const emoji = emojis.find(e => e.id === id);
          if (emoji) insert(`<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`);
        }} />}
      </div>
    </section>
    <section className="space-y-3 rounded-xl border bg-card p-5" aria-label={title + " preview"}>
      <h4 className="font-semibold">{title} preview</h4>
      {card.canvas && <p className="text-xs text-muted-foreground">Drag the avatar or text to position it. Use the arrow keys for fine adjustments.</p>}
      <div className={card.format === "plain" ? "space-y-2" : "space-y-2 rounded-lg border border-l-4 bg-muted/40 p-3"}>
      <div className="whitespace-pre-wrap break-words">{previewText(card.message, server, memberCount, false)}</div>
      {card.canvas && <div style={{ containerType: "inline-size" }}><div className="relative aspect-[1000/360] overflow-hidden rounded-lg bg-cover bg-center text-center"
        style={{ color: card.textColor, backgroundColor: card.backgroundColor, backgroundImage: background ? `url("${background}")` : undefined }}>
        {card.avatar && <CanvasLayer layer="avatar" card={card} move={move}>
          <img alt="Sample member avatar" draggable={false} className="block aspect-square w-full" style={{ borderRadius: card.avatarShape === "circle" ? "50%" : 0 }}
            src="https://cdn.discordapp.com/embed/avatars/0.png" /></CanvasLayer>}
        <CanvasLayer layer="text" card={card} move={move}><span className="block whitespace-pre" style={{ font: `${card.fontSize / 10}cqw/1.25 sans-serif` }}>
          {previewText(card.canvasText.split("\n").slice(0, 5).join("\n"), server, memberCount, true)}</span></CanvasLayer>
      </div></div>}</div>
    </section>
    {canManageRoles && <section className="space-y-3 rounded-xl border bg-card p-5">
      <h4 className="font-semibold">Automatic join roles</h4>
      <p className="text-sm text-muted-foreground">Roles apply when someone joins, including when welcome messages are off.</p>
      {(["autoRole", "botRole"] as const).map(field => <Picker key={field} label={field === "autoRole" ? "Member role" : "Bot role"}
        value={value[field] || "none"} pick={id => onChange({ ...value, [field]: id === "none" ? "" : id })}
        items={[{ id: "none", name: "None" }, ...(value[field] && !roles.some(r => r.id === value[field]) ? [{ id: value[field], name: "Role unavailable" }] : []), ...roles]} />)}
    </section>}
  </div>;
}
