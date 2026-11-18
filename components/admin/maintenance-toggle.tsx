"use client";

import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MaintenanceToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/maintenance", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load maintenance status");
      setEnabled(data.enabled);
      setError("");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not load maintenance status"); }
  }

  useEffect(() => { void load(); }, []);

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update maintenance mode");
      setEnabled(data.enabled);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not update maintenance mode"); }
    finally { setBusy(false); }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="flex items-center gap-2 font-semibold"><Wrench className="h-4 w-4" /> Website maintenance</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {enabled === null ? "Loading status…" : enabled ? "Enabled — visitors see a blurred page and maintenance notice." : "Disabled — the website is available to visitors."}
        </p>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex gap-2">
        {error && <Button variant="outline" onClick={load}>Refresh status</Button>}
        <Button variant={enabled ? "outline" : "default"} disabled={enabled === null || busy} onClick={toggle} aria-pressed={enabled === true}>
          {busy ? "Saving…" : enabled ? "Disable maintenance" : "Enable maintenance"}
        </Button>
      </div>
    </div>
  );
}
