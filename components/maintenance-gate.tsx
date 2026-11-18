"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Wrench } from "lucide-react";

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const adminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (adminPage) return;
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch("/api/maintenance", { cache: "no-store", signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          if (!controller.signal.aborted) setEnabled(data.enabled === true);
        }
      } catch { /* Retain the last known status during temporary outages. */ }
      finally { pending = false; }
    }
    void refresh();
    const timer = setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [adminPage]);

  const blocked = enabled && !adminPage;
  useEffect(() => {
    if (!blocked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [blocked]);

  return (
    <>
      <div inert={blocked} aria-hidden={blocked || undefined} className={blocked ? "pointer-events-none select-none blur-md" : undefined}>{children}</div>
      {blocked && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm" role="alert">
          <div className="w-full max-w-md rounded-md border border-border bg-card p-8 text-center shadow-2xl">
            <Wrench className="mx-auto mb-5 h-10 w-10 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-bold">Under maintenance</h1>
            <p className="mt-3 text-muted-foreground">We’re making improvements to the Delta website. Please check back soon.</p>
          </div>
        </div>
      )}
    </>
  );
}
