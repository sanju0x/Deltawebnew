"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";

  if (ua.includes("Firefox")) {
    browser = "Firefox";
  } else if (ua.includes("SamsungBrowser")) {
    browser = "Samsung Browser";
  } else if (ua.includes("Opera") || ua.includes("OPR")) {
    browser = "Opera";
  } else if (ua.includes("Trident")) {
    browser = "Internet Explorer";
  } else if (ua.includes("Edge")) {
    browser = "Edge (Legacy)";
  } else if (ua.includes("Edg")) {
    browser = "Edge";
  } else if (ua.includes("Chrome")) {
    browser = "Chrome";
  } else if (ua.includes("Safari")) {
    browser = "Safari";
  }

  return browser;
}

function getOSInfo() {
  const ua = navigator.userAgent;
  let os = "Unknown";

  if (ua.includes("Windows NT 10.0")) {
    os = "Windows 10/11";
  } else if (ua.includes("Windows NT 6.3")) {
    os = "Windows 8.1";
  } else if (ua.includes("Windows NT 6.2")) {
    os = "Windows 8";
  } else if (ua.includes("Windows NT 6.1")) {
    os = "Windows 7";
  } else if (ua.includes("Windows")) {
    os = "Windows";
  } else if (ua.includes("Mac OS X")) {
    os = "macOS";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  } else if (ua.includes("Android")) {
    os = "Android";
  } else if (ua.includes("iPhone") || ua.includes("iPad")) {
    os = "iOS";
  }

  return os;
}

function getDeviceType() {
  const ua = navigator.userAgent;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "Mobile";
  }
  return "Desktop";
}

export function VisitorTracker() {
  const pathname = usePathname();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Don't track admin pages
    if (pathname.startsWith("/admin")) return;

    const trackVisitor = async () => {
      try {
        const visitorData = {
          browser: getBrowserInfo(),
          os: getOSInfo(),
          device: getDeviceType(),
          screen: `${window.screen.width}x${window.screen.height}`,
          referrer: document.referrer || "Direct",
          page: pathname,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        await fetch("/api/track-visitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(visitorData),
        });
      } catch {
        // Silently fail - tracking shouldn't break the site
      }
    };

    // Small delay to not block initial page render
    const timer = setTimeout(trackVisitor, 1000);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
