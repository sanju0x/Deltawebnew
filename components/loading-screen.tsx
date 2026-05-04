"use client";

import { useEffect, useState } from "react";

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsLoading(false), 300);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-pulse delay-500" />
      </div>

      {/* Loading Content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo with Pulse Animation */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-card border-2 border-primary/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary animate-pulse">
              <svg
                className="h-10 w-10 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          
          {/* Rotating Ring */}
          <div className="absolute inset-[-8px] rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>

        {/* Brand Name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-wider">DELTA</h1>
          <p className="text-sm text-muted-foreground mt-1">Discord Music Bot</p>
        </div>

        {/* Progress Bar */}
        <div className="w-64">
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Loading... {Math.min(Math.round(progress), 100)}%
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
