"use client";

import { useState } from "react";

const commandCategories = [
  {
    name: "Music",
    commands: [
      { cmd: "/play", desc: "Play a song or add to queue" },
      { cmd: "/pause", desc: "Pause the current track" },
      { cmd: "/skip", desc: "Skip to the next song" },
      { cmd: "/queue", desc: "View the current queue" },
      { cmd: "/nowplaying", desc: "Show currently playing song" },
      { cmd: "/volume", desc: "Adjust the playback volume" },
    ],
  },
  {
    name: "Playlist",
    commands: [
      { cmd: "/playlist create", desc: "Create a new playlist" },
      { cmd: "/playlist add", desc: "Add a song to playlist" },
      { cmd: "/playlist load", desc: "Load a saved playlist" },
      { cmd: "/playlist delete", desc: "Delete a playlist" },
      { cmd: "/playlist list", desc: "View all playlists" },
      { cmd: "/playlist share", desc: "Share with others" },
    ],
  },
  {
    name: "Effects",
    commands: [
      { cmd: "/bassboost", desc: "Enhance bass frequencies" },
      { cmd: "/nightcore", desc: "Speed up with pitch shift" },
      { cmd: "/vaporwave", desc: "Slow down the audio" },
      { cmd: "/8d", desc: "Rotating 8D audio effect" },
      { cmd: "/karaoke", desc: "Remove vocals from track" },
      { cmd: "/reset", desc: "Remove all effects" },
    ],
  },
];

export function CommandsSection() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <section id="commands" className="py-24 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Simple commands,
            <span className="text-primary"> powerful results</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Easy to use slash commands that make controlling Delta a breeze.
          </p>
        </div>

        {/* Category Tabs - Android 14 Style */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {commandCategories.map((category, index) => (
            <button
              key={index}
              onClick={() => setActiveCategory(index)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCategory === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Commands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commandCategories[activeCategory].commands.map((command, index) => (
            <div
              key={index}
              className="rounded-[1.5rem] bg-card border border-border p-6 hover:border-primary/50 transition-all duration-300"
            >
              <code className="text-primary font-mono text-lg font-semibold">
                {command.cmd}
              </code>
              <p className="text-muted-foreground mt-2">{command.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
