"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Wrench } from "lucide-react";

const available = { enabled: false, dashboard: false, user: false };
const MaintenanceContext = createContext(available);
export const useMaintenance = () => useContext(MaintenanceContext);
export function MaintenanceBadge() {
  return <span className="rounded-full bg-red-700 px-2 py-0.5 text-xs font-semibold text-white">Maintenance</span>;
}
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const adminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const [status, setStatus] = useState(available);

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
          if (!controller.signal.aborted) setStatus({ enabled: data.enabled === true, dashboard: data.dashboard === true, user: data.user === true });
        }
      } catch { /* Retain the last known status during temporary outages. */ }
      finally { pending = false; }
    }
    void refresh();
    const timer = setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [adminPage]);

  const blocked = !adminPage && (status.enabled || (status.dashboard && pathname === "/dashboard") || (status.user && pathname === "/user-dashboard"));
  useEffect(() => {
    if (!blocked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [blocked]);

  return (
    <MaintenanceContext.Provider value={status}>
      <div key={blocked ? "blocked" : "available"} inert={blocked} aria-hidden={blocked || undefined} className={blocked ? "pointer-events-none select-none blur-md" : undefined}>{children}</div>
      {blocked && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm" role="alert">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
            <Wrench className="mx-auto mb-5 h-10 w-10 text-primary" aria-hidden="true" />
            {(pathname === "/dashboard" || pathname === "/user-dashboard") && <MaintenanceBadge />}
            <h1 className="text-2xl font-bold">Under maintenance</h1>
            <p className="mt-3 text-muted-foreground">We’re making improvements to the Delta website. Please check back soon.</p>
            {!status.enabled && <a className="button-primary mt-5" href="/">Return home</a>}
          </div>
        </div>
      )}
    </MaintenanceContext.Provider>
  );
}
