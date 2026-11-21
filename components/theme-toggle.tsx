"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted ? resolvedTheme === "dark" : true;
  const label = dark ? "Use light mode" : "Use dark mode";
  return (
    <button type="button" className="theme-control" onClick={() => setTheme(dark ? "light" : "dark")} title={label} aria-label={label}>
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
