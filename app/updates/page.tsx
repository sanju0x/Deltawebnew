"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  History,
  RefreshCw,
  Sparkles,
  Tag,
} from "lucide-react";

interface Update {
  _id: string;
  title: string;
  content: string;
  version: string;
  createdAt: string;
}

interface UpdatesResponse {
  enabled: boolean;
  updates: Update[];
}

export default function UpdatesPage() {
  const [data, setData] = useState<UpdatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/updates", { cache: "no-store" });
      if (!response.ok) throw new Error("Updates request failed");
      setData((await response.json()) as UpdatesResponse);
      setError(false);
    } catch (fetchError) {
      console.error("Failed to fetch updates:", fetchError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const latest = data?.updates[0];

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />

      <main className="relative flex-1 overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_70%_0%,color-mix(in_oklab,var(--primary)_15%,transparent),transparent_62%)]" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl">
          <section className="mb-12 grid items-end gap-8 border-b border-border pb-10 md:grid-cols-[1fr_auto]" aria-labelledby="updates-heading">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
                Product changelog
              </div>
              <h1 id="updates-heading" className="text-4xl font-bold tracking-[-0.05em] sm:text-6xl">
                What&apos;s new in Delta
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                New features, thoughtful improvements, and fixes that make every listening session better.
              </p>
            </div>

            {!loading && latest && (
              <div className="grid min-w-48 grid-cols-2 gap-3 md:grid-cols-1">
                <Summary label="Latest release" value={latest.version} />
                <Summary label="Published updates" value={String(data?.updates.length ?? 0)} />
              </div>
            )}
          </section>

          <section aria-live="polite" aria-busy={loading}>
            {loading ? (
              <UpdatesSkeleton />
            ) : error ? (
              <EmptyState
                icon={AlertCircle}
                title="Couldn&apos;t load updates"
                description="The changelog service did not respond. Try again to see the latest releases."
                action={<button onClick={fetchUpdates} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><RefreshCw className="size-4" aria-hidden="true" />Try again</button>}
              />
            ) : !data?.enabled ? (
              <EmptyState icon={History} title="Changelog taking a break" description="Updates are temporarily hidden while we prepare the next release. Check back soon." />
            ) : data.updates.length === 0 ? (
              <EmptyState icon={Sparkles} title="The first update is on its way" description="There are no release notes to show yet. Great things are being tuned behind the scenes." />
            ) : (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
                <div className="relative">
                  <div className="absolute bottom-3 left-[1.15rem] top-3 w-px bg-border sm:left-[1.4rem]" aria-hidden="true" />
                  <div className="space-y-6">
                    {data.updates.map((update, index) => (
                      <article key={update._id} className="relative pl-12 sm:pl-16">
                        <span className={`absolute left-2 top-7 grid size-6 place-items-center rounded-full border-4 border-background sm:left-[0.65rem] ${index === 0 ? "bg-primary" : "bg-muted-foreground"}`} aria-hidden="true">
                          {index === 0 && <span className="size-2 rounded-full bg-primary-foreground" />}
                        </span>

                        <div className={`rounded-[1.75rem] border bg-card p-5 shadow-sm transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-lg hover:shadow-foreground/5 sm:p-7 ${index === 0 ? "border-primary/25" : "border-border"}`}>
                          <div className="mb-5 flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                              <Tag className="size-3.5" aria-hidden="true" />
                              {update.version}
                            </span>
                            <time dateTime={update.createdAt} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <CalendarDays className="size-3.5" aria-hidden="true" />
                              {new Date(update.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                            </time>
                            {index === 0 && <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">Latest</span>}
                          </div>

                          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{update.title}</h2>
                          <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground sm:text-base">
                            {update.content}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-28" aria-label="Changelog information">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                    <History className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 font-bold">Never miss a beat</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Need help with a change or want to share feedback?</p>
                  <Link href="/support" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Visit support
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </aside>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof Sparkles; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-border bg-card px-6 py-16 text-center shadow-sm">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function UpdatesSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading updates">
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse rounded-[1.75rem] border border-border bg-card p-6 sm:p-7">
          <div className="h-6 w-24 rounded-full bg-muted" />
          <div className="mt-5 h-7 max-w-sm rounded-full bg-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded-full bg-muted" />
            <div className="h-3 w-4/5 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
