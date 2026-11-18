"use client";

import { useState } from "react";
import { Check, Clipboard, Crown, ListMusic, Music, Search, Settings, Sliders, Sparkles, X } from "lucide-react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const commandCategories = [
  { id: "music", name: "Music", icon: Music, commands: [
    { name: "/play", description: "Play a song from a URL or search query", usage: "/play <song name or URL>" },
    { name: "/pause", description: "Pause the current track", usage: "/pause" },
    { name: "/resume", description: "Resume the paused track", usage: "/resume" },
    { name: "/skip", description: "Skip to the next track in the queue", usage: "/skip" },
    { name: "/stop", description: "Stop playback and clear the queue", usage: "/stop" },
    { name: "/nowplaying", description: "Show the currently playing track", usage: "/nowplaying" },
    { name: "/seek", description: "Seek to a specific position in the track", usage: "/seek <time>" },
    { name: "/replay", description: "Replay the current track from the beginning", usage: "/replay" },
  ] },
  { id: "queue", name: "Queue & playlist", icon: ListMusic, commands: [
    { name: "/queue", description: "View the current queue", usage: "/queue" },
    { name: "/shuffle", description: "Shuffle the queue", usage: "/shuffle" },
    { name: "/loop", description: "Toggle loop mode for a track or queue", usage: "/loop <mode>" },
    { name: "/remove", description: "Remove a track from the queue", usage: "/remove <position>" },
    { name: "/clear", description: "Clear every track from the queue", usage: "/clear" },
    { name: "/move", description: "Move a track to a different position", usage: "/move <from> <to>" },
    { name: "/playlist save", description: "Save the current queue as a playlist", usage: "/playlist save <name>" },
    { name: "/playlist load", description: "Load a saved playlist", usage: "/playlist load <name>" },
  ] },
  { id: "effects", name: "Audio effects", icon: Sliders, commands: [
    { name: "/bass", description: "Adjust the bass boost level", usage: "/bass <level>" },
    { name: "/nightcore", description: "Enable the nightcore effect", usage: "/nightcore" },
    { name: "/vaporwave", description: "Enable the vaporwave effect", usage: "/vaporwave" },
    { name: "/8d", description: "Enable the 8D audio effect", usage: "/8d" },
    { name: "/volume", description: "Adjust playback volume", usage: "/volume <0-150>" },
    { name: "/equalizer", description: "Configure equalizer settings", usage: "/equalizer <preset>" },
    { name: "/speed", description: "Change playback speed", usage: "/speed <0.5-2.0>" },
    { name: "/pitch", description: "Adjust the audio pitch", usage: "/pitch <value>" },
  ] },
  { id: "settings", name: "Settings", icon: Settings, commands: [
    { name: "/settings", description: "View the current bot settings", usage: "/settings" },
    { name: "/prefix", description: "Change the bot prefix", usage: "/prefix <new prefix>" },
    { name: "/language", description: "Change the bot language", usage: "/language <code>" },
    { name: "/dj", description: "Set a DJ role for restricted commands", usage: "/dj <role>" },
    { name: "/announce", description: "Toggle now-playing announcements", usage: "/announce <on/off>" },
    { name: "/autoplay", description: "Toggle autoplay for related tracks", usage: "/autoplay <on/off>" },
  ] },
  { id: "premium", name: "Premium", icon: Crown, commands: [
    { name: "/247", description: "Stay connected to a voice channel around the clock", usage: "/247", premium: true },
    { name: "/lyrics", description: "Show lyrics for the current track", usage: "/lyrics", premium: true },
    { name: "/effects pro", description: "Open the premium audio effects", usage: "/effects pro", premium: true },
    { name: "/quality", description: "Set the audio quality to lossless", usage: "/quality <high/lossless>", premium: true },
    { name: "/autoqueue", description: "Automatically queue similar songs", usage: "/autoqueue <on/off>", premium: true },
  ] },
] as const;

export default function CommandsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("music");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const active = commandCategories.find((category) => category.id === activeCategory) ?? commandCategories[0];
  const filteredCommands = normalizedQuery
    ? commandCategories.flatMap((category) => category.commands.filter((command) => command.name.toLowerCase().includes(normalizedQuery) || command.description.toLowerCase().includes(normalizedQuery) || command.usage.toLowerCase().includes(normalizedQuery)))
    : active.commands;

  const copyUsage = async (usage: string) => {
    try {
      await navigator.clipboard.writeText(usage);
      setCopiedCommand(usage);
      window.setTimeout(() => setCopiedCommand(null), 1600);
    } catch { setCopiedCommand(null); }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />
      <main id="main-content" className="relative flex-1 overflow-hidden pb-24 pt-32 sm:pt-36">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] bg-[radial-gradient(circle_at_82%_8%,rgba(216,50,41,.16),transparent_30rem)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] opacity-35 [background-image:linear-gradient(rgba(61,47,37,.09)_1px,transparent_1px),linear-gradient(90deg,rgba(61,47,37,.09)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <div className="site-container relative">
          <section className="grid items-center gap-10 border-b border-border pb-14 lg:grid-cols-[1.05fr_.75fr] lg:gap-20" aria-labelledby="commands-heading">
            <div>
              <h1 id="commands-heading" className="max-w-[9ch] text-6xl font-bold leading-[.88] tracking-[-.075em] text-foreground sm:text-7xl lg:text-[6.7rem]">Your shortcut to <span className="text-primary">every sound.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Search the complete Delta command library, find the right syntax, and copy it straight into Discord.</p>
            </div>
            <div className="overflow-hidden rounded-md bg-[#24191c] p-6 text-white shadow-[0_30px_70px_rgba(62,35,20,.22)] sm:p-8">
              <div className="flex items-center justify-between text-[.65rem] font-extrabold uppercase tracking-[.16em] text-white/65"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#ff6257]" />Delta terminal</span><span>Ready</span></div>
              <div className="mt-14 font-mono text-sm leading-7 text-white/55"><p><span className="text-primary">›</span> /play late night drive</p><p className="pl-4 text-white/65">Searching across your favorite sources...</p><p className="mt-4"><span className="text-primary">✓</span> Added to queue</p></div>
              <div className="mt-12 flex items-end justify-between border-t border-white/10 pt-5"><strong className="text-3xl tracking-[-.05em]">35+ commands</strong><Sparkles className="size-6 text-primary" aria-hidden="true" /></div>
            </div>
          </section>

          <section className="py-12" aria-label="Find a command">
            <label htmlFor="command-search" className="mb-3 block text-xs font-extrabold uppercase tracking-[.14em] text-muted-foreground">Search the library</label>
            <div className="relative max-w-4xl">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
              <input id="command-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Try “playlist”, “volume”, or /play" className="min-h-16 w-full rounded-md border border-border bg-card px-14 text-base text-foreground shadow-[0_12px_35px_rgba(65,43,27,.07)] outline-none placeholder:text-muted-foreground focus:border-primary/45 focus:ring-4 focus:ring-primary/10" />
              {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear command search" className="absolute right-2.5 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"><X className="size-4" aria-hidden="true" /></button>}
            </div>
          </section>

          <section className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16" aria-label="Command library">
            <aside className="h-fit lg:sticky lg:top-28">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[.14em] text-muted-foreground">Categories</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1" role="group" aria-label="Command categories">
                {commandCategories.map((category) => { const Icon = category.icon; const selected = activeCategory === category.id && !normalizedQuery; return (
                  <button key={category.id} type="button" aria-pressed={selected} onClick={() => { setActiveCategory(category.id); setSearchQuery(""); }} className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 text-left text-sm font-bold transition-colors ${selected ? "bg-[#981724] text-white" : "border border-border bg-card text-muted-foreground hover:bg-card hover:text-primary"}`}>
                    <span className="flex min-w-0 items-center gap-2.5"><Icon className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{category.name}</span></span><span className="font-mono text-[.65rem] opacity-55">{String(category.commands.length).padStart(2, "0")}</span>
                  </button> ); })}
              </div>
            </aside>

            <div>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5" aria-live="polite">
                <div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-primary">{normalizedQuery ? "Search results" : "Selected collection"}</p><h2 className="mt-1 text-3xl font-bold tracking-[-.045em] text-foreground">{normalizedQuery ? `“${searchQuery.trim()}”` : active.name}</h2></div>
                <p className="font-mono text-xs font-bold text-muted-foreground">{filteredCommands.length} {filteredCommands.length === 1 ? "command" : "commands"}</p>
              </div>
              {filteredCommands.length > 0 ? (
                <div className="divide-y divide-[#3d2f25]/12 border-y border-border">
                  {filteredCommands.map((command, index) => (
                    <article key={`${command.name}-${command.usage}`} className="group grid gap-4 py-6 sm:grid-cols-[3rem_minmax(0,1fr)] sm:py-7">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                        <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-mono text-xl font-bold tracking-[-.03em] text-primary">{command.name}</h3>{"premium" in command && command.premium && <span className="inline-flex items-center gap-1 rounded-full bg-amber-300 px-2.5 py-1 text-[.65rem] font-extrabold uppercase tracking-[.08em] text-stone-950"><Crown className="size-3" aria-hidden="true" />Premium</span>}</div><p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{command.description}</p></div>
                        <button type="button" onClick={() => copyUsage(command.usage)} className="inline-flex min-h-12 w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 font-mono text-xs font-bold text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/8 hover:text-primary xl:w-auto" aria-label={`Copy ${command.usage}`}><code>{command.usage}</code>{copiedCommand === command.usage ? <><Check className="size-4 text-emerald-700" aria-hidden="true" /><span className="sr-only" role="status">Copied</span></> : <Clipboard className="size-4" aria-hidden="true" />}</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-border bg-card px-6 py-14 text-center"><Search className="mx-auto size-7 text-primary" aria-hidden="true" /><h3 className="mt-4 text-xl font-bold">No matching commands</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Try a broader word like “music”, “queue”, or “settings”.</p><button type="button" onClick={() => setSearchQuery("")} className="mt-5 min-h-11 cursor-pointer rounded-full bg-[#981724] px-5 text-sm font-bold text-white">Clear search</button></div>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
