"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = { id: string; kind: string; name: string; username?: string; image?: string; count?: number; reason?: string; occurrences?: number; lastSeen?: string };
type Results = { rows?: Row[]; more?: boolean; groups?: Record<string, Row[]> };
const headings: Record<string, string> = { user: "Most active users", server: "Most active servers", command: "Most used commands", song: "Most played songs" };
function Identity({ row }: { row: Row }) {
  return <div className="flex min-w-0 items-center gap-3">
    {["user", "server"].includes(row.kind) && (row.image ? <img alt="" src={row.image} className="size-10 rounded-full object-cover" /> : <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary">{row.name.slice(0, 1)}</span>)}
    <div className="min-w-0"><strong className="break-words">{row.name}</strong>
      {["user", "server"].includes(row.kind) && <p className="break-all text-xs text-muted-foreground">{row.username && `@${row.username} · `}{row.kind} · {row.id}</p>}
      {row.reason && <p className="text-sm">{row.reason} · {row.occurrences} flagged minute(s) · {new Date(row.lastSeen!).toLocaleString()}</p>}
    </div></div>;
}
export function BotActivity({ section }: { section: "blacklist" | "activity" | "analytics" }) {
  const [data, setData] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [kind, setKind] = useState("user");
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError("");
    fetch(`/api/admin/bot-activity?section=${section}&page=${page}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const value = await response.json(); if (!response.ok) throw Error(value.error); setData(value); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [section, page, refresh]);
  async function update(action: string, kind: string, id: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/bot-activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, kind, id }) });
      if (!response.ok) throw Error((await response.json()).error);
      setId(""); setPage(1); setRefresh(n => n + 1);
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-xl border p-5">
    <div className="flex justify-between gap-4"><h2 className="text-xl font-bold">{{ blacklist: "Blacklist", activity: "Suspicious activity", analytics: "Bot analytics" }[section]}</h2><Button variant="outline" onClick={() => setRefresh(n => n + 1)}>Refresh</Button></div>
    {section === "blacklist" && <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void update("add", kind, id); }}>
      <select aria-label="Target type" value={kind} onChange={e => setKind(e.target.value)}><option value="user">User</option><option value="server">Server</option></select>
      <Input className="max-w-xs" required pattern="[0-9]{17,20}" aria-label="Discord ID" placeholder="Discord ID" value={id} onChange={e => setId(e.target.value)} /><Button disabled={busy}>Add to blacklist</Button></form>}
    {section === "activity" && <p className="text-sm">Flags appear at 30 requests per user or 150 per server in a calendar minute on a bot cluster. Flags are for manual review.</p>}
    {error && <p role="alert">{error}</p>}{!data && !error && <p role="status">Loading…</p>}
    {data?.rows?.map(row => <div key={row.kind + row.id} className="flex items-center justify-between gap-3 border-t py-3"><Identity row={row} />{section === "blacklist" && <Button variant="outline" disabled={busy} onClick={() => void update("remove", row.kind, row.id)}>Remove</Button>}</div>)}
    {data?.rows?.length === 0 && <p>No entries on this page.</p>}
    {data?.rows && (page > 1 || data.more) && <div className="flex items-center gap-3"><Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>Page {page}<Button disabled={!data.more} onClick={() => setPage(page + 1)}>Next</Button></div>}
    {data?.groups && <div className="grid gap-4 md:grid-cols-2">{Object.entries(data.groups).map(([key, rows]) => <section className="rounded-xl border p-4" key={key}><h3 className="mb-3 font-semibold">{headings[key]}</h3>
      {rows.map(row => <div key={row.id} className="flex items-center justify-between gap-3 border-t py-2"><Identity row={row} /><strong>{row.count?.toLocaleString()}</strong></div>)}
      {!rows.length && <p>No usage recorded yet.</p>}</section>)}</div>}
  </section>;
}
