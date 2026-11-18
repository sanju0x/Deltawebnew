"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Trial = { _id: string; claimed: boolean; disabled?: boolean; endsAt?: number; notifiedAt?: number; notifyError?: string };
export function TrialsManager() {
  const [enabled, setEnabled] = useState(true);
  const [users, setUsers] = useState<Trial[]>([]);
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const actionPending = useRef(false);
  const requestVersion = useRef(0);
  async function load(filter = "") {
    const version = ++requestVersion.current;
    const response = await fetch(`/api/admin/trials${filter ? `?userId=${encodeURIComponent(filter)}` : ""}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load trials");
    if (version !== requestVersion.current) return;
    setEnabled(data.enabled); setUsers(data.users);
  }
  useEffect(() => { void load().catch((e) => setError(e.message)); }, []);
  async function act(action: string, target?: string) {
    if (actionPending.current) return;
    actionPending.current = true;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/trials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, userId: target }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      if (action === "reset-all") {
        requestVersion.current += 1;
        setUsers([]);
        setUserId("");
        setMessage(`Deleted ${data.deletedCount} trial user records. All users can claim again when new claims are enabled.`);
      }
      await load();
      if (action !== "reset-all") setMessage(action === "reset" ? "Claim reset. This user may claim again if enabled." : "Trial settings updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed"); }
    finally { actionPending.current = false; setBusy(false); }
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 p-4">
        <div>
          <p className="font-medium">Reset all trials</p>
          <p className="text-sm text-muted-foreground">Delete every trial user record, including users outside the latest 100 results.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="destructive" disabled={busy}>Reset all trials</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all trial users?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes every trial user record, including claim history, individual user blocks, and notification data. Current trials end, and everyone can claim again when new claims are enabled. The global trial setting and permanent access stay unchanged. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={busy} onClick={() => void act("reset-all")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete all trial users</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
