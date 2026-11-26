"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Tester = { userId: string; grantedAt: number };

export function BetaTestersManager() {
  const [testers, setTesters] = useState<Tester[]>([]);
  const [userId, setUserId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/beta-testers", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load beta testers");
    setTesters(data.testers);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load().catch(error => setError(error instanceof Error ? error.message : "Could not load beta testers"));
  }, [load]);

  async function refresh() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try { await load(); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not load beta testers"); }
    finally { pending.current = false; setBusy(false); }
  }

  async function update(action: "grant" | "revoke", target: string) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/beta-testers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: target }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update beta tester access");
      setMessage(`Access ${action === "grant" ? "granted to" : "revoked for"} ${data.userId}.`);
      if (action === "grant") setUserId("");
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update beta tester access");
    } finally { pending.current = false; setBusy(false); }
  }

  function grant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void update("grant", userId.trim());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beta tester access</CardTitle>
        <CardDescription>Grant access by Discord user ID. Testers can sign in with Discord to use the website and dashboards during maintenance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={grant} className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <label htmlFor="beta-tester-id" className="text-sm font-medium">Discord user ID</label>
            <Input id="beta-tester-id" value={userId} onChange={event => setUserId(event.target.value)} placeholder="Enter Discord user ID" inputMode="numeric" pattern="[0-9]{17,20}" maxLength={20} required disabled={busy} />
          </div>
          <Button type="submit" disabled={busy || !/^\d{17,20}$/.test(userId.trim())}>Grant access</Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void refresh()}>Refresh</Button>
        </form>
        <p className="text-sm text-muted-foreground">Revoke access to restore maintenance restrictions. Users with access still need their usual server permissions.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm">{message}</p>}
        {!loaded ? <p className="text-sm text-muted-foreground">{error ? "Tester list unavailable. Select Refresh to retry." : "Loading beta testers…"}</p> : testers.length === 0 ? <p className="text-sm text-muted-foreground">No beta testers have access yet.</p> : (
          <ul className="divide-y divide-border">
            {testers.map(tester => (
              <li key={tester.userId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="break-all font-mono text-sm">{tester.userId}</span>
                <Button type="button" variant="outline" disabled={busy} aria-label={`Revoke access for ${tester.userId}`} onClick={() => void update("revoke", tester.userId)}>Revoke access</Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
