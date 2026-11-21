"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Entry = { _id: string; category: string; title: string; createdAt: string; userId?: string; guildId?: string; message?: string };

export function SiteActivity() {
  const [category, setCategory] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState<{ rows: Entry[]; more: boolean } | null>(null);
  const [error, setError] = useState("");
  const before = history.at(-1) || "";
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    setResult(null);
    setError("");
    async function refresh() {
      try {
        const params = new URLSearchParams({ section: "website", category, before });
        const response = await fetch("/api/admin/bot-activity?" + params, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw Error(data.error || "Could not load activity.");
        if (!controller.signal.aborted) { setResult(data); setError(""); }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Could not load activity.");
      } finally {
        if (!controller.signal.aborted && !before) timer = setTimeout(refresh, 5000);
      }
    }
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [before, category]);

  return <section className="space-y-4 rounded-xl border p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold">Website activity</h2>
      <select aria-label="Filter activity" className="rounded-lg border bg-background p-2" value={category}
        onChange={e => { setCategory(e.target.value); setHistory([]); }}>
        <option value="">All activity</option><option>Dashboard</option><option>Trial</option><option value="Suggestion">Suggestions</option>
      </select>
    </div>
    {error && <p role="alert">{error}</p>}
    {!result && !error && <p role="status">Loading activity…</p>}
    {result?.rows.length === 0 && <p>No activity recorded for this filter.</p>}
    <ol>{result?.rows.map(row => <li className="space-y-1 border-t py-3" key={row._id}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{row.category}</span><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString()}</time>
      </div>
      <strong>{row.title}</strong>
      {row.message && <p className="whitespace-pre-wrap break-words">{row.message}</p>}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">{row.userId && <span>User {row.userId}</span>}{row.guildId && <span>Server {row.guildId}</span>}</div>
    </li>)}</ol>
    {(before || result?.more) && <div className="flex gap-2">
      <Button variant="outline" disabled={!before} onClick={() => setHistory(h => h.slice(0, -1))}>Newer</Button>
      <Button variant="outline" disabled={!result?.more} onClick={() => result && setHistory([...history, result.rows[result.rows.length - 1]._id])}>Older</Button>
    </div>}
  </section>;
}
