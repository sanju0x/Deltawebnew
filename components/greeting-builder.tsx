"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Bold, GripVertical, Heading, ImageIcon, Italic, List, Minus, Plus, Smile, Trash2, Type, Underline } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { imageUrl, IMAGE_HOSTS } from "@/lib/server-config-schema";
import type { Greetings, GuildOption } from "./greeting-editor";

type Block = Greetings["welcome"]["blocks"][number];
const tool = "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-30";
const defaults = ["😀", "😄", "🥰", "😎", "🥳", "😂", "👋", "🙌", "👏", "🤝", "👍", "❤️", "💜", "🔥", "✨", "🎉", "🎊", "🎈", "🚀", "⭐", "🌟", "💫", "🎵", "🎮", "👑", "💎", "✅", "💬", "🌈", "🌸", "🐱", "👀"];
export function newBlock(type: Block["type"], text = ""): Block {
  return { id: crypto.randomUUID(), type, text, url: "", description: "", divider: true, spacing: 1 };
}
export function effectiveBlocks(card: Greetings["welcome"]): Block[] {
  return card.blocks?.length ? card.blocks : [{ id: "message", type: "text", text: card.message, url: "", description: "", divider: true, spacing: 1 }];
}
function safeImage(url: string) { try { return imageUrl(url); } catch { return ""; } }

export function Palette({ label, value, pick }: { label: string; value: string; pick: (color: string) => void }) {
  const rgb = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
  const [hex, setHex] = useState<string | null>(null);
  const [red, green, blue] = rgb.map(n => n / 255);
  const high = Math.max(red, green, blue), low = Math.min(red, green, blue), delta = high - low;
  const hue = delta === 0 ? 0 : ((high === red ? (green - blue) / delta : high === green ? (blue - red) / delta + 2 : (red - green) / delta + 4) * 60 + 360) % 360;
  function wheel(x: number, y: number, element: HTMLElement) {
    const box = element.getBoundingClientRect();
    const h = (Math.atan2(y - box.top - box.height / 2, x - box.left - box.width / 2) * 180 / Math.PI + 450) % 360;
    const c = (1 - Math.abs((h / 60) % 2 - 1)) * 255;
    const channels = h < 60 ? [255, c, 0] : h < 120 ? [c, 255, 0] : h < 180 ? [0, 255, c] : h < 240 ? [0, c, 255] : h < 300 ? [c, 0, 255] : [255, 0, c];
    pick("#" + channels.map(n => Math.round(n).toString(16).padStart(2, "0")).join(""));
  }
  return <fieldset className="space-y-3 rounded-xl border bg-muted/10 p-4"><legend className="px-1 text-xs font-medium text-muted-foreground">{label}</legend>
    <div className="flex flex-wrap items-center gap-5">
      <div role="slider" tabIndex={0} aria-label={label + " hue circle"} aria-valuemin={0} aria-valuemax={359} aria-valuenow={Math.round(hue) % 360}
        className="relative size-24 shrink-0 touch-none cursor-crosshair rounded-full p-3 focus-visible:outline-2 focus-visible:outline-ring"
        style={{ background: "conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)" }}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); wheel(e.clientX, e.clientY, e.currentTarget); }}
        onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) wheel(e.clientX, e.clientY, e.currentTarget); }}
        onKeyDown={e => { if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return; e.preventDefault(); const h = (hue + (e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : -1) + 360) % 360; const box = e.currentTarget.getBoundingClientRect(); wheel(box.left + box.width / 2 + 40 * Math.cos((h - 90) * Math.PI / 180), box.top + box.height / 2 + 40 * Math.sin((h - 90) * Math.PI / 180), e.currentTarget); }}>
        <span className="block size-full rounded-full border-4 border-background shadow-inner" style={{ backgroundColor: value }} />
        <span className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ backgroundColor: value, left: `${50 + 44 * Math.sin(hue * Math.PI / 180)}%`, top: `${50 - 44 * Math.cos(hue * Math.PI / 180)}%` }} />
      </div>
      <div className="min-w-36 flex-1 space-y-2">
        <div className="flex gap-2"><input aria-label={"Custom " + label} type="color" value={value} onChange={e => pick(e.target.value)} className="size-9 cursor-pointer rounded border bg-transparent" />
          <Input aria-label={label + " hex"} className="font-mono uppercase" maxLength={7} value={hex ?? value} onChange={e => { setHex(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) pick(e.target.value); }} onBlur={() => setHex(null)} /></div>
        <div className="grid grid-cols-3 gap-2">{["R", "G", "B"].map((channel, index) => <label key={channel} className="text-[10px] text-muted-foreground">{channel}<Input aria-label={label + " " + channel} type="number" min={0} max={255} value={rgb[index]} className="h-8 px-2 font-mono text-xs" onChange={e => { const next = [...rgb]; next[index] = Math.max(0, Math.min(255, Math.round(Number(e.target.value)))); pick("#" + next.map(n => n.toString(16).padStart(2, "0")).join("")); }} /></label>)}</div>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">{["#182032", "#ffffff", "#5865f2", "#93c5fd", "#53dbac", "#ffb86b", "#f48fb1", "#ed4245"].map(color => <button key={color} type="button" aria-label={label + " " + color} aria-pressed={value.toLowerCase() === color} onClick={() => pick(color)} className="size-6 rounded-full border shadow-sm aria-pressed:ring-2 aria-pressed:ring-ring aria-pressed:ring-offset-2 aria-pressed:ring-offset-background" style={{ backgroundColor: color }} />)}</div>
  </fieldset>;
}

export function MessageInput({ label, value, onChange, emojis, maxLength = 2000 }: { label: string; value: string; onChange: (text: string) => void; emojis: GuildOption[]; maxLength?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: 0, end: 0 });
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("default");
  const [search, setSearch] = useState("");
  function insert(before: string, after = "", placeholder = "") {
    const input = ref.current;
    if (!input) return;
    const { start, end } = selection.current;
    const middle = after || placeholder ? value.slice(start, end) || placeholder : "";
    const next = value.slice(0, start) + before + middle + after + value.slice(end);
    if (next.length > maxLength) return;
    onChange(next);
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start + before.length + middle.length + after.length, start + before.length + middle.length + after.length); selection.current = { start: input.selectionStart, end: input.selectionEnd }; });
  }
  return <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-sm font-medium">{label}</span><span className="text-xs text-muted-foreground">{value.length}/{maxLength}</span></div>
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/25 px-2 py-1">
        {([{ icon: Bold, label: "Bold", before: "**", after: "**" }, { icon: Italic, label: "Italic", before: "*", after: "*" }, { icon: Underline, label: "Underline", before: "__", after: "__" }, { icon: Heading, label: "Heading", before: "\n## " }, { icon: List, label: "Bullet list", before: "\n- " }] as const).map(item => <button key={item.label} type="button" className={tool} aria-label={item.label} title={item.label} onMouseDown={e => e.preventDefault()} onClick={() => insert(item.before, "after" in item ? item.after : "", "text")}><item.icon size={15} /></button>)}
        <span className="mx-1 h-4 border-l" />
        <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button type="button" aria-label="Insert emoji" title="Insert emoji" className={tool}><Smile size={17} /></button></PopoverTrigger>
          <PopoverContent align="start" className="w-72 space-y-3" onCloseAutoFocus={e => e.preventDefault()}>
            <div className="flex gap-1 rounded-md bg-muted p-1">{["default", "server"].map(t => <button key={t} type="button" aria-pressed={tab === t} className={`flex-1 rounded px-3 py-1.5 text-xs capitalize ${tab === t ? "bg-background shadow-sm" : "text-muted-foreground"}`} onClick={() => setTab(t)}>{t} emojis</button>)}</div>
            {tab === "server" && <Input aria-label="Search server emojis" placeholder="Search server emojis…" value={search} onChange={e => setSearch(e.target.value)} />}
            <div className="grid max-h-48 grid-cols-7 gap-1 overflow-y-auto">{tab === "default" ? defaults.map(emoji => <button key={emoji} type="button" aria-label={"Insert " + emoji} className="rounded p-1.5 text-xl hover:bg-muted" onClick={() => { insert(emoji); setOpen(false); }}>{emoji}</button>) : emojis.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).map(emoji => <button key={emoji.id} type="button" title={emoji.name} aria-label={"Insert " + emoji.name} className="rounded p-1.5 hover:bg-muted" onClick={() => { insert(`<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`); setOpen(false); }}><img alt={emoji.name} src={`https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}`} className="size-6 object-contain" /></button>)}</div>
            {tab === "server" && !emojis.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).length && <p className="text-xs text-muted-foreground">No server emojis found.</p>}
          </PopoverContent>
        </Popover>
      </div>
      <Textarea ref={ref} aria-label={label} value={value} maxLength={maxLength} rows={3} className="rounded-none border-0 shadow-none" onSelect={e => { selection.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd }; }} onChange={e => onChange(e.target.value)} />
    </div>
    <div className="flex flex-wrap gap-1.5">{["user", "username", "server", "count", "memberpositions", "userid"].map(token => <button key={token} type="button" className="rounded border bg-muted/20 px-1.5 py-1 font-mono text-[10px] text-muted-foreground hover:bg-muted" onMouseDown={e => e.preventDefault()} onClick={() => insert("{" + token + "}")}>{"{" + token + "}"}</button>)}</div>
  </div>;
}

export function ComponentBuilder({ blocks, onChange, emojis }: { blocks: Block[]; onChange: (blocks: Block[]) => void; emojis: GuildOption[] }) {
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const names = { text: "Text", separator: "Separator", image: "Image / GIF", section: "Text + thumbnail" };
  function update(id: string, patch: Partial<Block>) { onChange(blocks.map(b => b.id === id ? { ...b, ...patch } : b)); }
  function move(id: string, index: number) { const next = [...blocks]; const from = next.findIndex(b => b.id === id); if (from < 0 || index < 0 || index >= next.length || from === index) return; const [item] = next.splice(from, 1); next.splice(index, 0, item); onChange(next); }
  return <div className="space-y-3">
    <div className="flex items-center justify-between"><div><h4 className="text-sm font-semibold">Message blocks</h4><p className="mt-1 text-xs text-muted-foreground">Drag the grip to reorder. Arrow buttons work on touch and keyboard.</p></div><span className="text-xs text-muted-foreground">{blocks.length}/10</span></div>
    {blocks.map((block, index) => <div key={block.id} onDragOver={e => { if (drag) { e.preventDefault(); setOver(block.id); } }} onDrop={e => { e.preventDefault(); if (drag) move(drag, index); setDrag(null); setOver(null); }} className={`overflow-hidden rounded-xl border bg-background transition ${over === block.id && drag !== block.id ? "border-primary ring-1 ring-primary" : ""} ${drag === block.id ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 border-b bg-muted/25 px-3 py-2">
        <button type="button" draggable aria-label={"Drag " + names[block.type]} className={tool + " cursor-grab active:cursor-grabbing"} onDragStart={e => { setDrag(block.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", block.id); }} onDragEnd={() => { setDrag(null); setOver(null); }}><GripVertical size={16} /></button>
        <span className="flex-1 text-xs font-medium">{String(index + 1).padStart(2, "0")} · {names[block.type]}</span>
        <button type="button" aria-label="Move block up" className={tool} disabled={!index} onClick={() => move(block.id, index - 1)}><ArrowUp size={14} /></button>
        <button type="button" aria-label="Move block down" className={tool} disabled={index === blocks.length - 1} onClick={() => move(block.id, index + 1)}><ArrowDown size={14} /></button>
        <button type="button" aria-label="Remove block" className={tool} disabled={blocks.length === 1} onClick={() => onChange(blocks.filter(b => b.id !== block.id))}><Trash2 size={14} /></button>
      </div>
      <div className="space-y-3 p-4">
        {(block.type === "text" || block.type === "section") && <MessageInput label="Text content" value={block.text} onChange={text => update(block.id, { text })} emojis={emojis} />}
        {(block.type === "image" || block.type === "section") && <><label className="block space-y-1 text-xs"><span>{block.type === "section" ? "Thumbnail" : "Image or GIF"} URL</span><Input type="url" maxLength={2048} placeholder="https://media.tenor.com/…/welcome.gif" value={block.url} aria-invalid={!!block.url && !safeImage(block.url)} onChange={e => update(block.id, { url: e.target.value })} /></label>
          {block.url && !safeImage(block.url) && <p className="text-xs text-destructive">Use a direct HTTPS image link from a supported host.</p>}
          <label className="block space-y-1 text-xs"><span>Image description</span><Input value={block.description} maxLength={1024} placeholder="Describe this image for screen readers" onChange={e => update(block.id, { description: e.target.value })} /></label></>}
        {block.type === "separator" && <div className="flex flex-wrap items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={block.divider} onChange={e => update(block.id, { divider: e.target.checked })} />Show divider line</label><label className="flex items-center gap-2">Spacing<select aria-label="Separator spacing" className="rounded border bg-background p-2 text-xs" value={block.spacing} onChange={e => update(block.id, { spacing: Number(e.target.value) })}><option value={1}>Small</option><option value={2}>Large</option></select></label></div>}
      </div>
    </div>)}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{([{ type: "text", icon: Type }, { type: "separator", icon: Minus }, { type: "image", icon: ImageIcon }, { type: "section", icon: Plus }] as const).map(({ type, icon: Icon }) => <button key={type} type="button" disabled={blocks.length >= 10} onClick={() => onChange([...blocks, newBlock(type)])} className="flex items-center justify-center gap-2 rounded-lg border border-dashed px-2 py-3 text-xs hover:border-primary hover:bg-primary/5 disabled:opacity-40"><Icon size={15} />{names[type]}</button>)}</div>
    <p className="text-[11px] leading-relaxed text-muted-foreground">Direct image and animated GIF links: {IMAGE_HOSTS.join(", ")}. Up to 3500 characters across text blocks.</p>
  </div>;
}

export function MarkdownPreview({ text, render }: { text: string; render: (text: string) => ReactNode }) {
  function inline(value: string): ReactNode { return value.split(/(\*\*.+?\*\*|__.+?__|\*[^*]+\*)/g).map((part, i) => part.startsWith("**") ? <strong key={i}>{render(part.slice(2, -2))}</strong> : part.startsWith("__") ? <u key={i}>{render(part.slice(2, -2))}</u> : part.startsWith("*") && part.endsWith("*") ? <em key={i}>{render(part.slice(1, -1))}</em> : <span key={i}>{render(part)}</span>); }
  return <div className="min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed">{text.split("\n").map((line, i) => /^#{1,3} /.test(line) ? <div key={i} className={`font-bold ${line.startsWith("# ") ? "text-xl" : line.startsWith("## ") ? "text-lg" : "text-base"}`}>{inline(line.replace(/^#{1,3} /, ""))}</div> : /^[-*] /.test(line) ? <div key={i} className="flex gap-2 pl-2"><span>•</span><span>{inline(line.slice(2))}</span></div> : <div key={i} className="min-h-[1.5em]">{inline(line)}</div>)}</div>;
}

export function ComponentPreview({ card, render, children }: { card: Greetings["welcome"]; render: (text: string) => ReactNode; children?: ReactNode }) {
  return <div className="space-y-3 rounded-lg border border-l-4 bg-[#2b2d31] p-4 text-[#dbdee1]" style={{ borderLeftColor: card.accentColor || "#5865f2" }}>
    {effectiveBlocks(card).map(block => <div key={block.id}>
      {block.type === "text" && <MarkdownPreview text={block.text} render={render} />}
      {block.type === "separator" && <div style={{ paddingBlock: block.spacing === 2 ? 12 : 4 }}>{block.divider && <hr className="border-white/15" />}</div>}
      {block.type === "image" && (safeImage(block.url) ? <img className="max-h-80 w-full rounded-md object-contain" src={safeImage(block.url)} alt={block.description || "Message image"} /> : <div className="flex h-28 items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 text-xs text-gray-400"><ImageIcon size={18} />Add an image or GIF link</div>)}
      {block.type === "section" && <div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1"><MarkdownPreview text={block.text} render={render} /></div>{safeImage(block.url) ? <img className="size-20 shrink-0 rounded-lg object-cover" src={safeImage(block.url)} alt={block.description || "Thumbnail"} /> : <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/20"><ImageIcon size={20} /></div>}</div>}
    </div>)}
    {children}
  </div>;
}
