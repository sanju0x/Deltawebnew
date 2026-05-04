"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Search, Music, ListMusic, Sliders, Settings, Crown } from "lucide-react";

const commandCategories = [
  {
    id: "music",
    name: "Music",
    icon: Music,
    commands: [
      { name: "/play", description: "Play a song from URL or search query", usage: "/play <song name or URL>" },
      { name: "/pause", description: "Pause the current track", usage: "/pause" },
      { name: "/resume", description: "Resume the paused track", usage: "/resume" },
      { name: "/skip", description: "Skip to the next track in queue", usage: "/skip" },
      { name: "/stop", description: "Stop playback and clear the queue", usage: "/stop" },
      { name: "/nowplaying", description: "Show the currently playing track", usage: "/nowplaying" },
      { name: "/seek", description: "Seek to a specific position in the track", usage: "/seek <time>" },
      { name: "/replay", description: "Replay the current track from the beginning", usage: "/replay" },
    ],
  },
  {
    id: "queue",
    name: "Queue & Playlist",
    icon: ListMusic,
    commands: [
      { name: "/queue", description: "View the current queue", usage: "/queue" },
      { name: "/shuffle", description: "Shuffle the queue", usage: "/shuffle" },
      { name: "/loop", description: "Toggle loop mode (track/queue/off)", usage: "/loop <mode>" },
      { name: "/remove", description: "Remove a track from the queue", usage: "/remove <position>" },
      { name: "/clear", description: "Clear all tracks from the queue", usage: "/clear" },
      { name: "/move", description: "Move a track to a different position", usage: "/move <from> <to>" },
      { name: "/playlist save", description: "Save current queue as a playlist", usage: "/playlist save <name>" },
      { name: "/playlist load", description: "Load a saved playlist", usage: "/playlist load <name>" },
    ],
  },
  {
    id: "effects",
    name: "Audio Effects",
    icon: Sliders,
    commands: [
      { name: "/bass", description: "Adjust bass boost level", usage: "/bass <level>" },
      { name: "/nightcore", description: "Enable nightcore effect", usage: "/nightcore" },
      { name: "/vaporwave", description: "Enable vaporwave effect", usage: "/vaporwave" },
      { name: "/8d", description: "Enable 8D audio effect", usage: "/8d" },
      { name: "/volume", description: "Adjust playback volume", usage: "/volume <0-150>" },
      { name: "/equalizer", description: "Configure equalizer settings", usage: "/equalizer <preset>" },
      { name: "/speed", description: "Change playback speed", usage: "/speed <0.5-2.0>" },
      { name: "/pitch", description: "Adjust audio pitch", usage: "/pitch <value>" },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    commands: [
      { name: "/settings", description: "View current bot settings", usage: "/settings" },
      { name: "/prefix", description: "Change the bot prefix", usage: "/prefix <new prefix>" },
      { name: "/language", description: "Change bot language", usage: "/language <code>" },
      { name: "/dj", description: "Set DJ role for restricted commands", usage: "/dj <role>" },
      { name: "/announce", description: "Toggle now playing announcements", usage: "/announce <on/off>" },
      { name: "/autoplay", description: "Toggle autoplay related tracks", usage: "/autoplay <on/off>" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    icon: Crown,
    commands: [
      { name: "/247", description: "Enable 24/7 mode to stay in voice channel", usage: "/247", premium: true },
      { name: "/lyrics", description: "Show lyrics for the current track", usage: "/lyrics", premium: true },
      { name: "/effects pro", description: "Access premium audio effects", usage: "/effects pro", premium: true },
      { name: "/quality", description: "Set audio quality to lossless", usage: "/quality <high/lossless>", premium: true },
      { name: "/autoqueue", description: "Auto-queue similar songs", usage: "/autoqueue <on/off>", premium: true },
    ],
  },
];

export default function CommandsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("music");

  const filteredCommands = searchQuery
    ? commandCategories.flatMap((cat) =>
        cat.commands.filter(
          (cmd) =>
            cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : commandCategories.find((cat) => cat.id === activeCategory)?.commands || [];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Bot <span className="text-primary">Commands</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore all available commands to get the most out of Delta.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Category Tabs */}
          {!searchQuery && (
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {commandCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Commands List */}
          <div className="max-w-4xl mx-auto">
            <div className="space-y-3">
              {filteredCommands.map((cmd) => (
                <div
                  key={cmd.name}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-primary font-mono font-semibold text-lg">
                          {cmd.name}
                        </code>
                        {"premium" in cmd && cmd.premium && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-medium">
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground">{cmd.description}</p>
                    </div>
                    <code className="text-sm bg-secondary px-4 py-2 rounded-xl text-muted-foreground font-mono whitespace-nowrap">
                      {cmd.usage}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            {filteredCommands.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No commands found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
