"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Radio, RefreshCw, ShieldCheck, WifiOff, XCircle } from "lucide-react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

type BotStatusType = "online" | "offline" | "maintenance";
interface BotStatus { status: BotStatusType; message: string; updatedAt: string; }

const statusConfig = {
  online: { icon: CheckCircle2, label: "All systems operational", shortLabel: "Operational", description: "Delta is online and ready to play.", panel: "bg-emerald-700", soft: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  offline: { icon: XCircle, label: "Service interruption", shortLabel: "Offline", description: "Delta is currently unavailable.", panel: "bg-[#b52821]", soft: "bg-red-100", text: "text-red-800", border: "border-red-200", dot: "bg-red-500" },
  maintenance: { icon: AlertTriangle, label: "Scheduled maintenance", shortLabel: "Maintenance", description: "Delta is receiving a careful tune-up.", panel: "bg-amber-500", soft: "bg-amber-100", text: "text-amber-900", border: "border-amber-200", dot: "bg-amber-500" },
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
      setStatus((await response.json()) as BotStatus);
      setCheckedAt(new Date());
      setError(false);
    } catch (fetchError) {
      console.error("Failed to fetch status:", fetchError);
      setError(true);
    } finally { setLoading(false); setRefreshing(false); }
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
      <main id="main-content" className="relative flex-1 overflow-hidden pb-24 pt-32 sm:pt-36">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] opacity-35 [background-image:radial-gradient(rgba(216,50,41,.28)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <div className="site-container relative">
          <section className="mb-12 grid items-end gap-8 border-b border-[#3d2f25]/15 pb-10 lg:grid-cols-[1fr_auto]" aria-labelledby="status-heading">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em] text-primary"><Radio className="size-4" aria-hidden="true" />Live operations</p>
              <h1 id="status-heading" className="mt-5 max-w-[10ch] text-6xl font-bold leading-[.88] tracking-[-.075em] text-[#1d1a17] sm:text-7xl lg:text-[6.5rem]">The signal, <span className="text-primary">right now.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#685f57] sm:text-lg">A live view of Delta’s availability, checked automatically every 30 seconds.</p>
            </div>
            <button onClick={() => fetchStatus(true)} disabled={loading || refreshing} className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#3d2f25]/15 bg-[#fffaf2]/80 px-5 text-sm font-bold text-[#352e29] shadow-sm transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-wait disabled:opacity-55">
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />{refreshing ? "Checking…" : "Refresh status"}
            </button>
          </section>

          <section aria-live="polite" aria-busy={loading}>
            {loading ? <StatusSkeleton /> : error && !status ? (
              <div className="rounded-[2.5rem] border border-[#3d2f25]/13 bg-[#fffaf2]/78 px-6 py-20 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive"><WifiOff className="size-8" aria-hidden="true" /></span>
                <h2 className="mt-6 text-3xl font-bold tracking-[-.045em]">Status check unavailable</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#71675f]">We could not reach the status service. This does not necessarily mean Delta is offline.</p>
                <button onClick={() => fetchStatus(true)} className="mt-7 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-[#1d1a17] px-6 text-sm font-bold text-[#fff8ed]"><RefreshCw className="size-4" aria-hidden="true" />Try again</button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[2.75rem] border border-[#3d2f25]/13 bg-[#fffaf2]/78 shadow-[0_28px_75px_rgba(65,43,27,.1)]">
                <div className="grid lg:grid-cols-[.72fr_1.28fr]">
                  <div className={`relative flex min-h-[25rem] flex-col justify-between overflow-hidden p-7 text-white sm:p-10 ${config.panel}`}>
                    <div className="absolute -right-20 -top-20 size-64 rounded-full border-[3rem] border-white/10" aria-hidden="true" />
                    <div className="relative flex items-center justify-between text-[.65rem] font-extrabold uppercase tracking-[.16em] text-white/70"><span>Current state</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-white" />Live</span></div>
                    <div className="relative my-12">
                      <span className="grid size-20 place-items-center rounded-[1.6rem] bg-white/15 backdrop-blur"><StatusIcon className="size-10" aria-hidden="true" /></span>
                      <h2 className="mt-7 max-w-[10ch] text-4xl font-bold leading-[.95] tracking-[-.055em] sm:text-5xl">{config.label}</h2>
                      <p className="mt-4 max-w-sm text-sm leading-6 text-white/72">{config.description}</p>
                    </div>
                    <div className="relative border-t border-white/20 pt-5 font-mono text-xs font-bold text-white/65">Delta network / {config.shortLabel}</div>
                  </div>

                  <div className="p-6 sm:p-9 lg:p-11">
                    <div className="flex items-center gap-2"><Activity className="size-5 text-primary" aria-hidden="true" /><p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#776c63]">Service monitor</p></div>
                    <div className="mt-6 overflow-hidden rounded-2xl border border-[#3d2f25]/13">
                      <div className="grid gap-4 bg-[#fffdf8] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
                        <div className="flex items-center gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#1d1a17] text-[#fff8ed]"><Activity className="size-5" aria-hidden="true" /></span><div><h3 className="font-bold">Delta bot</h3><p className="mt-1 text-sm text-[#776d64]">Commands and audio playback</p></div></div>
                        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold ${config.border} ${config.soft} ${config.text}`}><i className={`size-2 rounded-full ${config.dot}`} />{config.shortLabel}</span>
                      </div>
                    </div>

                    {status?.message && <div className="mt-4 rounded-2xl bg-[#eee3d6]/65 p-5"><p className="text-[.65rem] font-extrabold uppercase tracking-[.14em] text-[#857970]">Service note</p><p className="mt-2 leading-6 text-[#433a34]">{status.message}</p></div>}

                    <div className="mt-7 grid gap-4 border-t border-[#3d2f25]/13 pt-7 sm:grid-cols-2">
                      <TimeDetail label="Last updated" value={status?.updatedAt} />
                      <TimeDetail label="Last checked" value={checkedAt?.toISOString()} />
                    </div>
                    {error && <p className="mt-5 rounded-xl bg-amber-100 p-3 text-xs leading-5 text-amber-900" role="status">The latest refresh failed. Showing the last known status.</p>}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="mt-10" aria-labelledby="status-guide-heading">
            <div className="mb-5 flex items-center gap-3"><ShieldCheck className="size-5 text-primary" aria-hidden="true" /><h2 id="status-guide-heading" className="text-xl font-bold tracking-[-.03em]">How to read the signal</h2></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatusMeaning icon={CheckCircle2} title="Operational" description="Everything is running normally." className="bg-emerald-100 text-emerald-800" />
              <StatusMeaning icon={AlertTriangle} title="Maintenance" description="Planned work is in progress." className="bg-amber-100 text-amber-900" />
              <StatusMeaning icon={XCircle} title="Offline" description="The service is temporarily unavailable." className="bg-red-100 text-red-800" />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function TimeDetail({ label, value }: { label: string; value?: string }) {
  return <div><div className="flex items-center gap-2 text-[.65rem] font-extrabold uppercase tracking-[.12em] text-[#887c72]"><Clock3 className="size-3.5" aria-hidden="true" />{label}</div><time className="mt-2 block text-sm font-bold leading-5 text-[#342d28]" dateTime={value}>{value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Not available"}</time></div>;
}

function StatusMeaning({ icon: Icon, title, description, className }: { icon: typeof CheckCircle2; title: string; description: string; className: string }) {
  return <article className="rounded-2xl border border-[#3d2f25]/12 bg-[#fffaf2]/70 p-5"><span className={`grid size-10 place-items-center rounded-xl ${className}`}><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-[#746a61]">{description}</p></article>;
}

function StatusSkeleton() {
  return <div className="grid animate-pulse overflow-hidden rounded-[2.75rem] border border-[#3d2f25]/12 bg-[#fffaf2]/70 lg:grid-cols-[.72fr_1.28fr]" role="status"><span className="sr-only">Loading current status</span><div className="min-h-[25rem] bg-muted" /><div className="p-8 sm:p-11"><div className="h-4 w-32 rounded-full bg-muted" /><div className="mt-8 h-28 rounded-2xl bg-muted" /><div className="mt-5 h-20 rounded-2xl bg-muted" /></div></div>;
}
