"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button className="theme-control" type="button" aria-label="Toggle light and dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      <Moon className="dark:hidden" size={17} /><Sun className="hidden dark:block" size={17} />
    </button>
  );
}
