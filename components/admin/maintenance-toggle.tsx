"use client";

import { useEffect, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MaintenanceToggle({ scope, title }: { scope: "website" | "dashboard" | "user"; title: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);

  async function load() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/maintenance", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load maintenance status");
      if (typeof data?.enabled !== "boolean") throw new Error("Invalid maintenance status. Refresh to try again.");
      setEnabled(scope === "website" ? data.enabled : data[scope] === true);
      setError("");
    } catch (error) {
      setEnabled(null);
      setError(error instanceof Error ? error.message : "Could not load maintenance status");
    } finally { pending.current = false; setBusy(false); }
  }

  useEffect(() => { void load(); }, [scope]);

  async function toggle() {
    if (enabled === null || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, enabled: !enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update maintenance mode");
      if (typeof data?.enabled !== "boolean") throw new Error("Invalid maintenance status. Refresh to try again.");
      setEnabled(data.enabled);
    } catch (error) {
      setEnabled(null);
      setError(error instanceof Error ? error.message : "Could not update maintenance mode");
    } finally { pending.current = false; setBusy(false); }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="flex items-center gap-2 font-semibold"><Wrench className="h-4 w-4" /> {title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {enabled === null ? (error ? "Status unavailable. Refresh to try again." : "Loading status…") : enabled ? "Maintenance enabled" : "Available"}
        </p>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex gap-2">
        {error && <Button variant="outline" disabled={busy} onClick={load}>Refresh status</Button>}
        <Button variant={enabled ? "outline" : "default"} disabled={enabled === null || busy} onClick={toggle} aria-pressed={enabled === true}>
          {busy ? (enabled === null ? "Loading…" : "Saving…") : enabled ? "Disable maintenance" : "Enable maintenance"}
        </Button>
      </div>
    </div>
  );
}
