"use client";

import { useState, type CSSProperties, type ReactNode, type PointerEvent } from "react";
import { Check, Palette, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DisplayNameFont, DisplayNameEffect } from "@/lib/server-config-schema";
import "./display-name-style.css";

type StyleValue = { displayNameFontID: number; displayNameEffectID: number; displayNameColors: number[] };
const title = (name: string) => name.toLowerCase().split("_").map(word => word[0].toUpperCase() + word.slice(1)).join(" ");
const fonts = Object.entries(DisplayNameFont).filter(([name]) => name !== "UNSPECIFIED").map(([name, id]) => ({ name: title(name), id }));
const effects = Object.entries(DisplayNameEffect).map(([name, id]) => ({ name: id === 0 ? "Default" : title(name), id }));
const hex = (color: number) => `#${color.toString(16).padStart(6, "0")}`;

export function DisplayNamePreview({ font, effect, colors, children, className = "" }: { font: number; effect: number; colors: number[]; children: ReactNode; className?: string }) {
  const style = { "--name-color": hex(colors[0] ?? 0xFFFFFF), "--name-color-end": hex(colors[1] ?? colors[0] ?? 0xB875FF) } as CSSProperties;
  return <strong className={`display-name font-${font || 11} effect-${effect} ${className}`} style={style}>{children}</strong>;
}

function toHsv(color: number): [number, number, number] {
  const r = (color >> 16) / 255, g = ((color >> 8) & 255) / 255, b = (color & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, max === 0 ? 0 : d / max * 100, max * 100];
}
function fromHsv(h: number, s: number, v: number) {
  s /= 100; v /= 100;
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  const rgb = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
  return rgb.reduce((result, channel) => result * 256 + Math.round((channel + m) * 255), 0);
}

function NameColorPicker({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [heldHue, setHeldHue] = useState(0);
  const [actualHue, saturation, brightness] = toHsv(value);
  const hue = saturation === 0 || brightness === 0 ? heldHue : actualHue;
  function pick(h: number, s: number, v: number) { setHeldHue(h); onChange(fromHsv(h, s, v)); }
  function pickPoint(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    pick(hue, Math.max(0, Math.min(100, (event.clientX - box.left) / box.width * 100)), Math.max(0, Math.min(100, 100 - (event.clientY - box.top) / box.height * 100)));
  }
  return <fieldset className="name-color-picker min-w-0 space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
    <legend className="px-1 text-sm font-medium">{label}</legend>
    <div aria-hidden="true" className="color-plane" style={{ backgroundColor: `hsl(${hue} 100% 50%)` }}
      onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); pickPoint(event); }}
      onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) pickPoint(event); }}>
      <span style={{ left: `${saturation}%`, top: `${100 - brightness}%`, backgroundColor: hex(value) }} />
    </div>
    <label className="block text-sm text-muted-foreground">Hue<input className="hue-range mt-2 block w-full" aria-label={`${label} hue`} type="range" min="0" max="359" value={Math.round(hue)} onChange={event => pick(Number(event.target.value), saturation, brightness)} /></label>
    <div className="grid grid-cols-2 gap-3">{[{ name: "Saturation", value: saturation, set: (n: number) => pick(hue, n, brightness) }, { name: "Brightness", value: brightness, set: (n: number) => pick(hue, saturation, n) }].map(slider => <label key={slider.name} className="text-sm text-muted-foreground">{slider.name}<input className="mt-2 block w-full accent-rose-500" aria-label={`${label} ${slider.name.toLowerCase()}`} type="range" min="0" max="100" value={Math.round(slider.value)} onChange={event => slider.set(Number(event.target.value))} /></label>)}</div>
    <div className="flex items-center gap-3"><label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/20" style={{ backgroundColor: hex(value) }}><input type="color" className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label={`${label} custom color`} value={hex(value)} onChange={event => onChange(parseInt(event.target.value.slice(1), 16))} /></label>
      <Input aria-label={`${label} hex`} className="font-mono uppercase" maxLength={7} value={draft ?? hex(value)} onChange={event => { setDraft(event.target.value); if (/^#?[a-f0-9]{6}$/i.test(event.target.value)) onChange(parseInt(event.target.value.replace("#", ""), 16)); }} onBlur={() => setDraft(null)} />
    </div>
    <div className="flex flex-wrap gap-2">{[0xFFFFFF, 0x171717, 0xED4245, 0xF59E0B, 0x57F287, 0x38BDF8, 0x5865F2, 0xEB459E].map(color => <button key={color} type="button" className="grid size-7 place-items-center rounded-full border border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label={`${label} ${hex(color)}`} aria-pressed={value === color} style={{ backgroundColor: hex(color), color: color === 0x171717 || color === 0x5865F2 ? "white" : "black" }} onClick={() => onChange(color)}>{value === color && <Check size={14} />}</button>)}</div>
  </fieldset>;
}

export function DisplayNameStyleEditor({ prefix, value, onChange }: { prefix: string; value: StyleValue; onChange: (value: Partial<StyleValue>) => void }) {
  const font = value.displayNameFontID || DisplayNameFont.DEFAULT;
  return <div className="name-style-editor space-y-6 rounded-xl border border-white/10 bg-black/10 p-4 sm:p-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor={`${prefix}-font`}>Display name style</Label><Select value={String(font)} onValueChange={id => onChange({ displayNameFontID: Number(id) })}><SelectTrigger className="w-full" id={`${prefix}-font`}><SelectValue /></SelectTrigger><SelectContent>{fonts.map(option => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor={`${prefix}-effect`}>Display effect style</Label><Select value={String(value.displayNameEffectID)} onValueChange={id => onChange({ displayNameEffectID: Number(id) })}><SelectTrigger className="w-full" id={`${prefix}-effect`}><SelectValue /></SelectTrigger><SelectContent>{effects.map(option => <SelectItem key={option.id} value={String(option.id)}>{option.name}</SelectItem>)}</SelectContent></Select></div>
    </div>
    <details className="name-style-chart rounded-xl border border-white/10 bg-[#0c0c0e] p-4" open>
      <summary className="cursor-pointer text-sm font-semibold">Browse fonts & effects</summary>
      <div className="mt-5 flex items-center gap-3"><Type className="size-6 text-white/70" /><div><h4 className="font-bold">Display Name Fonts (17)</h4><p className="text-sm text-white/50">Choose a style for your bot’s name.</p></div></div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{[...fonts.filter(option => option.id !== 11), ...fonts.filter(option => option.id === 11)].map(option => <button key={option.id} type="button" aria-pressed={font === option.id} onClick={() => onChange({ displayNameFontID: option.id })} className="name-style-tile"><DisplayNamePreview font={option.id} effect={0} colors={[]} className="text-4xl">Aa</DisplayNamePreview><span>{option.name}</span></button>)}</div>
      <div className="mt-6 flex items-center gap-3"><Sparkles className="size-6 text-white/70" /><div><h4 className="font-bold">Display Name Effects (9)</h4><p className="text-sm text-white/50">Give your name a finishing touch.</p></div></div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">{effects.map(option => <button key={option.id} type="button" aria-pressed={value.displayNameEffectID === option.id} onClick={() => onChange({ displayNameEffectID: option.id })} className="name-style-tile"><DisplayNamePreview font={11} effect={option.id} colors={option.id === 2 ? [0xEB459E, 0x7C3AED] : option.id === 3 || option.id === 5 ? [0xED4245] : option.id === 8 ? [0xFF8AB8] : []} className="text-4xl">Aa</DisplayNamePreview><span>{option.name}</span></button>)}</div>
      <p className="mt-4 text-sm text-white/50">Browser previews are approximate; Discord applies the final fonts and effects.</p>
    </details>
    <div className="space-y-3"><div className="flex items-center gap-2"><Palette size={18} /><Label htmlFor={`${prefix}-colors`}>Display name colors</Label></div>
      <Select value={String(value.displayNameColors.length)} onValueChange={count => onChange({ displayNameColors: Array.from({ length: Number(count) }, (_, i) => value.displayNameColors[i] ?? (i ? 0xA855F7 : 0xFFFFFF)) })}><SelectTrigger className="w-full" id={`${prefix}-colors`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Default</SelectItem><SelectItem value="1">One color</SelectItem><SelectItem value="2">Two colors</SelectItem></SelectContent></Select>
      <div className="grid gap-4 sm:grid-cols-2">{value.displayNameColors.map((color, index) => <NameColorPicker key={index} label={`Color ${index + 1}`} value={color} onChange={color => onChange({ displayNameColors: value.displayNameColors.map((current, i) => i === index ? color : current) })} />)}</div>
      <p className="text-sm text-muted-foreground">Choose two colors for a custom gradient. Your profile preview updates as you edit.</p>
      <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => onChange({ displayNameFontID: 10, displayNameEffectID: 2, displayNameColors: [0xFFFFFF, 0xA855F7] })}>Use Sinistre gradient</Button><Button type="button" variant="outline" onClick={() => onChange({ displayNameFontID: 0, displayNameEffectID: 0, displayNameColors: [] })}>Reset name style</Button></div>
    </div>
  </div>;
}
