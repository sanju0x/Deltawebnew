"use client";

import { Button } from "@/components/ui/button";
import { Play, Music, Headphones } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 mb-8 border border-border">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Now serving 10,000+ Discord servers
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 tracking-tight text-balance">
          The Ultimate
          <br />
          <span className="text-primary">Music Bot</span>
          <br />
          for Discord
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
          Crystal clear audio, lightning-fast commands, and seamless playback.
          Delta brings the party to your Discord server.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            size="lg"
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg gap-2"
          >
            <Play className="h-5 w-5" />
            Add to Discord
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-border text-foreground hover:bg-secondary px-8 py-6 text-lg"
          >
            View Commands
          </Button>
        </div>

        {/* Music Player Preview Card */}
        <div className="max-w-md mx-auto">
          <div className="rounded-[2rem] bg-card border border-border p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Now Playing</p>
                <p className="text-sm text-muted-foreground">
                  Blinding Lights - The Weeknd
                </p>
              </div>
              <Headphones className="h-6 w-6 text-primary" />
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-primary rounded-full" />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">2:34</span>
                <span className="text-xs text-muted-foreground">3:42</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
              <button className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
                <svg className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
