"use client";
import { useRef, useState, type ReactNode } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { defaultGreetings, imageUrl, IMAGE_HOSTS } from "@/lib/server-config-schema";
import { Palette, MessageInput, ComponentBuilder, ComponentPreview, MarkdownPreview, effectiveBlocks } from "./greeting-builder";

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
  const card = value[kind];
  const title = kind === "welcome" ? "Welcome" : "Goodbye";
  function change(patch: Partial<typeof card>) { onChange({ ...value, [kind]: { ...card, ...patch } }); }
  function move(layer: Layer, x: number, y: number) {
    const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
    change({ [`${layer}X`]: clamp(x), [`${layer}Y`]: clamp(y) });
  }
  let background = "";
  try { background = imageUrl(card.backgroundImage); } catch { /* An incomplete URL can be edited. */ }
  const canvasPreview = card.canvas && <div style={{ containerType: "inline-size" }}><div className="relative aspect-[1000/360] overflow-hidden rounded-lg bg-cover bg-center text-center"
        style={{ color: card.textColor, backgroundColor: card.backgroundColor, backgroundImage: background ? `url("${background}")` : undefined }}>
        {card.avatar && <CanvasLayer layer="avatar" card={card} move={move}>
          <img alt="Sample member avatar" draggable={false} className="block aspect-square w-full" style={{ borderRadius: card.avatarShape === "circle" ? "50%" : 0 }}
            src="https://cdn.discordapp.com/embed/avatars/0.png" /></CanvasLayer>}
        <CanvasLayer layer="text" card={card} move={move}><span className="block whitespace-pre" style={{ font: `${card.fontSize / 10}cqw/1.25 sans-serif` }}>
          {previewText(card.canvasText.split("\n").slice(0, 5).join("\n"), server, memberCount, true)}</span></CanvasLayer>
      </div></div>;
  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
    <section className="min-w-0 space-y-4 rounded-xl border bg-card p-5">
      <div><h3 className="font-semibold">Greeting studio</h3><p className="mt-1 text-xs text-muted-foreground">Build a personal welcome or farewell for your community.</p></div>
      <div className="flex gap-2">{(["welcome", "goodbye"] as const).map(k =>
        <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); }}
          className={`rounded-lg border px-4 py-2 capitalize ${kind === k ? "bg-primary text-primary-foreground" : ""}`}>{k}</button>)}</div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={card.enabled} onChange={e => change({ enabled: e.target.checked })} />Enable {kind} messages</label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Picker label="Delivery channel" value={card.channelId || "none"} pick={id => change({ channelId: id === "none" ? "" : id })}
          items={[{ id: "none", name: "Select a channel" }, ...channels.map(c => ({ ...c, name: "#" + c.name }))]} />
        <Picker label="Message format" value={card.format} pick={format => change({ format })} items={[
          { id: "components", name: "Components V2" }, { id: "embed", name: "Embed (classic)" }, { id: "plain", name: "Plain message" }]} />
      </div>
      {card.format === "components" ? <>
        <Picker label="Media source" value={card.canvas ? "canvas" : "image"} pick={source => change({ canvas: source === "canvas" })}
          items={[{ id: "image", name: "Image / GIF links" }, { id: "canvas", name: "Generated canvas" }]} />
        <p className="text-xs text-muted-foreground">{card.canvas ? "Your personalized canvas appears below the message blocks." : "Add image or thumbnail blocks with direct image and GIF links."}</p>
        <ComponentBuilder key={kind} blocks={effectiveBlocks(card)} onChange={blocks => change({ blocks })} emojis={emojis} />
        <Palette label="Container accent" value={card.accentColor || "#5865f2"} pick={accentColor => change({ accentColor })} />
      </> : <MessageInput key={kind + "message"} label="Message" value={card.message} onChange={message => change({ message })} emojis={emojis} />}
      {card.format !== "components" && <label className="flex items-center gap-2"><input type="checkbox" checked={card.canvas} onChange={e => change({ canvas: e.target.checked })} />Attach a canvas image</label>}
      {card.canvas && <>
        <MessageInput key={kind + "canvas"} label="Canvas text" maxLength={600} value={card.canvasText} onChange={canvasText => change({ canvasText })} emojis={emojis} />
        <label className="block">Background image URL<Input type="url" maxLength={2048} value={card.backgroundImage} onChange={e => change({ backgroundImage: e.target.value })} /></label>
        <p className="text-xs text-muted-foreground">Use an image from {IMAGE_HOSTS.join(", ")} or leave blank for a solid background.</p>
        <label className="flex items-center gap-2"><input type="checkbox" checked={card.avatar} onChange={e => change({ avatar: e.target.checked })} />Show member avatar</label>
        {card.avatar && <Picker label="Avatar shape" value={card.avatarShape} pick={avatarShape => change({ avatarShape })}
          items={[{ id: "circle", name: "Circle" }, { id: "square", name: "Square" }]} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <Palette label="Background color" value={card.backgroundColor} pick={backgroundColor => change({ backgroundColor })} />
          <Palette label="Text color" value={card.textColor} pick={textColor => change({ textColor })} />
        </div>
        <label>Text size {card.fontSize}px<Input type="range" min={16} max={80} value={card.fontSize} onChange={e => change({ fontSize: Number(e.target.value) })} /></label>
      </>}
    </section>
    <section className="min-w-0 space-y-3 rounded-xl border bg-card p-5 xl:sticky xl:top-5" aria-label={title + " preview"}>
      <h4 className="font-semibold">{title} preview</h4>
      {card.canvas && <p className="text-xs text-muted-foreground">Drag the avatar or text to position it. Use the arrow keys for fine adjustments.</p>}
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-emerald-400" />Live preview / {card.format === "components" ? "Components V2" : card.format === "embed" ? "Classic embed" : "Plain message"}</div>
      {card.format === "components" ? <ComponentPreview card={card} render={text => previewText(text, server, memberCount, false)}>{canvasPreview}</ComponentPreview> : <div className={card.format === "plain" ? "space-y-2" : "space-y-2 rounded-lg border border-l-4 bg-muted/40 p-3"}>
      <MarkdownPreview text={card.message} render={text => previewText(text, server, memberCount, false)} />
      {canvasPreview}</div>}
    </section>
    {canManageRoles && <section className="space-y-3 rounded-xl border bg-card p-5 xl:col-span-2">
      <h4 className="font-semibold">Automatic join roles</h4>
      <p className="text-sm text-muted-foreground">Roles apply when someone joins, including when welcome messages are off.</p>
      {(["autoRole", "botRole"] as const).map(field => <Picker key={field} label={field === "autoRole" ? "Member role" : "Bot role"}
        value={value[field] || "none"} pick={id => onChange({ ...value, [field]: id === "none" ? "" : id })}
        items={[{ id: "none", name: "None" }, ...(value[field] && !roles.some(r => r.id === value[field]) ? [{ id: value[field], name: "Role unavailable" }] : []), ...roles]} />)}
    </section>}
  </div>;
}
