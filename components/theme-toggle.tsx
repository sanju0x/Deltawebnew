"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const id = useId().replace(/:/g, "");
  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => setMounted(true), []);

  return (
    <div className="theme-toggle">
      <svg className="theme-toggle__filters" aria-hidden="true">
        <defs>
          <filter id={`sketchy-${id}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="turbulence" baseFrequency="0.035 0.042" numOctaves={4} result="noise" seed={42} />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={`sketchy-sm-${id}`} x="-18%" y="-18%" width="136%" height="136%">
            <feTurbulence type="turbulence" baseFrequency="0.06" numOctaves={3} result="noise" seed={7} />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <label className="theme-switch" title={isDark ? "Use light mode" : "Use dark mode"}>
        <span className="sr-only">{isDark ? "Use light mode" : "Use dark mode"}</span>
        <input
          className="theme-switch__checkbox"
          type="checkbox"
          checked={isDark}
          onChange={(event) => setTheme(event.target.checked ? "dark" : "light")}
          aria-label={isDark ? "Use light mode" : "Use dark mode"}
        />
        <span
          className="theme-switch__container"
          style={{
            "--sketch-filter": `url(#sketchy-${id})`,
            "--sketch-filter-small": `url(#sketchy-sm-${id})`,
          } as CSSProperties}
        >
          <span className="theme-switch__clouds" />
          <span className="theme-switch__stars" aria-hidden="true">{"\u2726 \u00b7 \u2727 \u00b7 \u2726"}</span>
          <span className="theme-switch__circle-container">
            <span className="theme-switch__sun-moon">
              <span className="theme-switch__moon">
                <span className="theme-switch__spot" />
                <span className="theme-switch__spot" />
                <span className="theme-switch__spot" />
              </span>
            </span>
          </span>
          <span className="theme-switch__shooting-star" />
          <span className="theme-switch__shooting-star theme-switch__shooting-star--two" />
        </span>
      </label>
    </div>
  );
}
