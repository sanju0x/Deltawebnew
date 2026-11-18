"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Trial = { _id: string; claimed: boolean; disabled?: boolean; endsAt?: number; notifiedAt?: number; notifyError?: string };
export function TrialsManager() {
  const [enabled, setEnabled] = useState(true);
  const [users, setUsers] = useState<Trial[]>([]);
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load(filter = "") {
    const response = await fetch(`/api/admin/trials${filter ? `?userId=${encodeURIComponent(filter)}` : ""}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load trials");
    setEnabled(data.enabled); setUsers(data.users);
  }
  useEffect(() => { void load().catch((e) => setError(e.message)); }, []);
  async function act(action: string, target?: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/trials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, userId: target }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      await load(); setMessage(action === "reset" ? "Claim reset. This user may claim again if enabled." : "Trial settings updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed"); }
    finally { setBusy(false); }
  }
  return <Card>
    <CardHeader><CardTitle>No-Prefix trials</CardTitle></CardHeader>
    <CardContent className="space-y-6">
      <p>One free 30-day trial per Discord account. Reset allows another claim and ends current trial access. Disabling a user revokes trial access; enabling restores only the remaining time.</p>
      <div className="flex flex-wrap items-center gap-3"><span>New claims: {enabled ? "Enabled" : "Disabled"}</span><Button disabled={busy} onClick={() => void act(enabled ? "disable" : "enable")}>{enabled ? "Disable claims" : "Enable claims"}</Button></div>
      <p className="text-sm text-muted-foreground">Pausing new claims lets existing trials finish. Individual user blocks also stop new claims. Permanent access is unaffected.</p>
      <div className="flex flex-wrap gap-2">
        <Input aria-label="Discord user ID" placeholder="Discord user ID" className="max-w-xs" value={userId} onChange={(e) => setUserId(e.target.value.trim())} />
        <Button disabled={busy || !/^\d{17,20}$/.test(userId)} onClick={() => { setError(""); void load(userId).catch((e) => setError(e.message)); }}>Find user</Button>
        <Button disabled={busy} variant="outline" onClick={() => void load().catch((e) => setError(e.message))}>Show latest 100</Button>
        {([['reset', 'Reset claim'], ['disable-user', 'Disable user'], ['enable-user', 'Enable user']] as const).map(([action, label]) => <Button key={action} variant="outline" disabled={busy || !/^\d{17,20}$/.test(userId)} onClick={() => void act(action, userId)}>{label}</Button>)}
      </div>
      {error && <p role="alert" className="text-red-500">{error}</p>}
      {message && <p role="status">{message}</p>}
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr><th className="p-2">Discord user</th><th className="p-2">Status</th><th className="p-2">Ends</th><th className="p-2">Expiry DM</th></tr></thead>
        <tbody>{users.map((user) => <tr key={user._id} className="border-t border-border">
          <td className="p-2"><button className="underline" onClick={() => setUserId(user._id)}>{user._id}</button></td>
          <td className="p-2">{user.disabled ? "Disabled" : !user.claimed ? "Eligible" : (user.endsAt || 0) > Date.now() ? "Active" : "Used / expired"}</td>
          <td className="p-2">{user.endsAt ? new Date(user.endsAt).toLocaleString() : "—"}</td>
          <td className="p-2">{user.notifyError ? "Delivery failed" : user.notifiedAt ? "Sent" : user.claimed ? "Pending" : "—"}</td>
        </tr>)}</tbody>
      </table>{!users.length && <p className="py-4">No trial records found.</p>}</div>
    </CardContent>
  </Card>;
}
