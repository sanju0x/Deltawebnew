"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  WifiOff,
  XCircle,
} from "lucide-react";

type BotStatusType = "online" | "offline" | "maintenance";

interface BotStatus {
  status: BotStatusType;
  message: string;
  updatedAt: string;
}

const statusConfig = {
  online: {
    icon: CheckCircle2,
    label: "All systems operational",
    shortLabel: "Operational",
    description: "Delta is online and ready to play.",
    accent: "text-emerald-700 dark:text-emerald-400",
    soft: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    dot: "bg-emerald-500",
  },
  offline: {
    icon: XCircle,
    label: "Service interruption",
    shortLabel: "Offline",
    description: "Delta is currently unavailable.",
    accent: "text-red-700 dark:text-red-400",
    soft: "bg-red-500/10",
    border: "border-red-500/25",
    dot: "bg-red-500",
  },
  maintenance: {
    icon: AlertTriangle,
    label: "Scheduled maintenance",
    shortLabel: "Maintenance",
    description: "Delta is receiving a little tune-up.",
    accent: "text-amber-700 dark:text-amber-400",
    soft: "bg-amber-500/10",
    border: "border-amber-500/25",
    dot: "bg-amber-500",
  },
};

export default function StatusPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const fetchStatus = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await fetch("/api/bot-status", { cache: "no-store" });
      if (!response.ok) throw new Error("Status request failed");
      const data = (await response.json()) as BotStatus;
      setStatus(data);
      setCheckedAt(new Date());
      setError(false);
    } catch (fetchError) {
      console.error("Failed to fetch status:", fetchError);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = window.setInterval(() => fetchStatus(), 30000);
    return () => window.clearInterval(interval);
  }, [fetchStatus]);

  const config = status ? statusConfig[status.status] : statusConfig.online;
  const StatusIcon = config.icon;

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />

      <main className="relative flex-1 overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_65%)]" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl">
          <section className="mx-auto mb-10 max-w-2xl text-center" aria-labelledby="status-heading">
            <h1 id="status-heading" className="text-4xl font-bold tracking-[-0.045em] sm:text-6xl">
              Delta status
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              A real-time view of Delta&apos;s availability, refreshed automatically every 30 seconds.
            </p>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-foreground/5" aria-live="polite" aria-busy={loading}>
            {loading ? (
              <StatusSkeleton />
            ) : error && !status ? (
              <div className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                  <WifiOff className="size-7" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-bold">Status check unavailable</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  We could not reach the status service. This does not necessarily mean Delta is offline.
                </p>
                <button onClick={() => fetchStatus(true)} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className={`border-b ${config.border} ${config.soft} px-6 py-8 sm:px-9 sm:py-10`}>
                  <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <span className={`relative grid size-14 shrink-0 place-items-center rounded-2xl border ${config.border} bg-card/80 ${config.accent} shadow-sm sm:size-16`}>
                        <StatusIcon className="size-7 sm:size-8" aria-hidden="true" />
                        <span className={`absolute -right-1 -top-1 size-4 rounded-full border-[3px] border-card ${config.dot}`} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Current status</p>
                        <h2 className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${config.accent}`}>{config.label}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchStatus(true)}
                      disabled={refreshing}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
                    >
                      <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
                      {refreshing ? "Checking…" : "Refresh status"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
                  <div className="p-6 sm:p-9">
                    <div className="mb-5 flex items-center gap-2">
                      <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                      <h3 className="font-bold">Service overview</h3>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 p-4 sm:p-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary">
                          <Activity className="size-5 text-foreground" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold">Delta bot</p>
                          <p className="truncate text-sm text-muted-foreground">Commands and audio playback</p>
                        </div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${config.border} ${config.soft} ${config.accent}`}>
                        <span className={`size-2 rounded-full ${config.dot}`} />
                        {config.shortLabel}
                      </span>
                    </div>

                    {status?.message && (
                      <div className="mt-4 rounded-2xl border border-border bg-secondary/35 p-4 sm:p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Service note</p>
                        <p className="mt-2 leading-6">{status.message}</p>
                      </div>
                    )}
                  </div>

                  <aside className="border-t border-border bg-secondary/25 p-6 sm:w-64 sm:border-l sm:border-t-0 sm:p-8" aria-label="Status timestamps">
                    <TimeDetail label="Last updated" value={status?.updatedAt} />
                    <div className="my-5 h-px bg-border" />
                    <TimeDetail label="Last checked" value={checkedAt?.toISOString()} />
                    {error && (
                      <p className="mt-5 rounded-xl bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-300">
                        The latest refresh failed. Showing the last known status.
                      </p>
                    )}
                  </aside>
                </div>
              </>
            )}
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-labelledby="status-guide-heading">
            <h2 id="status-guide-heading" className="sr-only">Status guide</h2>
            <StatusMeaning icon={CheckCircle2} title="Operational" description="Everything is running normally." className="text-emerald-700 dark:text-emerald-400" />
            <StatusMeaning icon={AlertTriangle} title="Maintenance" description="Planned work is in progress." className="text-amber-700 dark:text-amber-400" />
            <StatusMeaning icon={XCircle} title="Offline" description="The service is temporarily unavailable." className="text-red-700 dark:text-red-400" />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function TimeDetail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        <Clock3 className="size-3.5" aria-hidden="true" />
        {label}
      </div>
      <time className="mt-2 block text-sm font-semibold leading-5" dateTime={value}>
        {value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Not available"}
      </time>
    </div>
  );
}

function StatusMeaning({ icon: Icon, title, description, className }: { icon: typeof CheckCircle2; title: string; description: string; className: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <Icon className={`size-5 ${className}`} aria-hidden="true" />
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

function StatusSkeleton() {
  return (
    <div className="animate-pulse p-6 sm:p-9">
      <div className="flex items-center gap-5">
        <div className="size-16 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="h-7 max-w-sm rounded-full bg-muted" />
          <div className="h-3 max-w-xs rounded-full bg-muted" />
        </div>
      </div>
      <div className="mt-9 h-24 rounded-2xl bg-muted" />
    </div>
  );
}
