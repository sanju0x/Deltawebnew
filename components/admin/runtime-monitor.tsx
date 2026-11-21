"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Metric = number | null;
type Shard = { id: number; status: string; servers: number; latency: Metric };
type AudioNode = {
  id: string; connected: boolean; players: Metric; playing: Metric;
  cpu: Metric; memory: Metric; uptime: Metric; deficits: Metric;
};
type Snapshot = { cluster: number; seenAt: string; shards: Shard[]; nodes: AudioNode[] };

function format(value: Metric, unit = "", scale = 1) {
  return value === null ? "—" : (value * scale).toLocaleString(undefined, { maximumFractionDigits: 1 }) + unit;
}

function Metrics({ items }: { items: [string, string][] }) {
  return <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-border pt-4">
    {items.map(([label, value]) => <div key={label}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-lg tabular-nums">{value}</dd>
    </div>)}
  </dl>;
}

export function RuntimeMonitor({ mode }: { mode: "audio" | "shards" }) {
  const audio = mode === "audio";
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cluster, setCluster] = useState("all");
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/runtime", { cache: "no-store", signal: controller.signal });
        if (response.status === 401) {
          setSnapshots([]);
          throw new Error("Your admin session expired. Sign in again to view telemetry.");
        }
        if (!response.ok) throw new Error("Could not refresh telemetry. Retrying in 15 seconds.");
        const payload = await response.json();
        if (!controller.signal.aborted) {
          setSnapshots(payload.snapshots);
          setError("");
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Telemetry unavailable.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          timer = setTimeout(poll, 15000);
        }
      }
    }
    void poll();
    const clock = setInterval(() => setNow(Date.now()), 5000);
    return () => { controller.abort(); clearTimeout(timer); clearInterval(clock); };
  }, [refresh]);

  const visible = snapshots.filter(s => cluster === "all" || String(s.cluster) === cluster);
  return <section className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold">{audio ? "Lavalink audio backend monitor" : "Shard manager grid"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Refreshes every 15 seconds. Readings older than one minute are marked stale.</p>
      </div>
      <div className="flex items-center gap-2">
        <select aria-label="Filter by cluster" value={cluster} onChange={e => setCluster(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          <option value="all">All clusters</option>
          {snapshots.map(s => <option key={s.cluster} value={s.cluster}>Cluster {s.cluster}</option>)}
        </select>
        <Button variant="outline" disabled={loading} onClick={() => setRefresh(v => v + 1)}>
          <RefreshCw className={loading ? "animate-spin" : ""} />Refresh
        </Button>
      </div>
    </header>
    {error && <p role="alert" className="rounded border border-destructive/40 p-4">{error}</p>}
    {!visible.length && !error && <p role="status" className="rounded border border-border p-6 text-muted-foreground">
      {loading ? "Loading telemetry…" : "No cluster reports in the last 24 hours for this selection."}
    </p>}
    {visible.map(s => {
      const stale = now - Date.parse(s.seenAt) > 60000;
      return <section key={s.cluster} className="space-y-3">
        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
          <h3 className="font-semibold">Cluster {s.cluster} <span className="ml-2 text-sm font-normal text-muted-foreground">
            {audio ? s.nodes.length + " node connections" : s.shards.length + " shards · " + s.shards.reduce((sum, shard) => sum + shard.servers, 0).toLocaleString() + " servers"}
          </span></h3>
          <span className={stale ? "text-xs text-amber-500" : "text-xs text-muted-foreground"}>
            {stale ? "Stale · Last report " : "Last report "}<time dateTime={s.seenAt}>{new Date(s.seenAt).toLocaleString()}</time>
          </span>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {audio ? s.nodes.map(node => <article key={node.id} className="rounded-md border border-border border-t-2 border-t-emerald-500 bg-card p-4">
            <div className="flex items-baseline justify-between gap-2"><h4 className="break-all font-semibold">{node.id}</h4>
              <span className="text-sm">{stale ? "Stale" : node.connected ? "Connected" : "Disconnected"}</span></div>
            <Metrics items={[
              ["Players", format(node.players)], ["Playing", format(node.playing)],
              ["Lavalink CPU", format(node.cpu, "%", 100)], ["Memory used", format(node.memory, " MiB", 1 / 1048576)],
              ["Node uptime", format(node.uptime, " h", 1 / 3600000)], ["Frame deficit", format(node.deficits)]
            ]} />
          </article>) : s.shards.map(shard => <article key={shard.id} className="rounded-md border border-border border-t-2 border-t-violet-500 bg-card p-4">
            <div className="flex items-baseline justify-between gap-2"><h4 className="font-semibold">Shard #{shard.id}</h4>
              <span className="text-sm capitalize">{stale ? "Stale" : shard.status}</span></div>
            <Metrics items={[["Servers", format(shard.servers)], ["Heartbeat latency", format(shard.latency, " ms")]]} />
          </article>)}
        </div>
        {(audio ? !s.nodes.length : !s.shards.length) && <p className="text-sm text-muted-foreground">This cluster reported no {audio ? "Lavalink nodes" : "shards"}.</p>}
      </section>;
    })}
  </section>;
}
