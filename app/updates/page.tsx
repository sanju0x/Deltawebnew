"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarDays, History, RefreshCw, Sparkles, Tag } from "lucide-react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

interface Update { _id: string; title: string; content: string; version: string; createdAt: string; }
interface UpdatesResponse { enabled: boolean; updates: Update[]; }

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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);
  const latest = data?.updates[0];

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />
      <main id="main-content" className="relative flex-1 overflow-hidden pb-24 pt-32 sm:pt-36">
        <div className="pointer-events-none absolute -right-28 top-24 size-[34rem] rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
        <div className="site-container relative">
          <section className="grid overflow-hidden rounded-[2.75rem] border border-[#3d2f25]/12 bg-[#fffaf2]/70 shadow-[0_25px_70px_rgba(65,43,27,.09)] lg:grid-cols-[1fr_22rem]" aria-labelledby="updates-heading">
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em] text-primary"><History className="size-4" aria-hidden="true" />Release notes</p>
              <h1 id="updates-heading" className="mt-5 max-w-[9ch] text-6xl font-bold leading-[.88] tracking-[-.075em] text-[#1d1a17] sm:text-7xl lg:text-[6.3rem]">What&apos;s new in <span className="text-primary">Delta.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#6a6058] sm:text-lg">A running record of new features, careful improvements, and fixes that keep every session in tune.</p>
            </div>
            <div className="relative flex min-h-80 flex-col justify-between overflow-hidden bg-primary p-7 text-primary-foreground sm:p-9">
              <div className="absolute -right-14 -top-14 size-48 rounded-full border-[2.5rem] border-white/10" aria-hidden="true" />
              <div className="relative flex items-center justify-between text-[.65rem] font-extrabold uppercase tracking-[.15em] text-white/70"><span>Latest drop</span><Sparkles className="size-5" aria-hidden="true" /></div>
              <div className="relative mt-16">
                {loading ? <div className="h-16 w-40 animate-pulse rounded-2xl bg-white/15" /> : <strong className="block text-5xl font-bold tracking-[-.065em]">{latest?.version || "Soon"}</strong>}
                <p className="mt-3 max-w-[18rem] text-sm leading-6 text-white/70">{latest ? latest.title : "The next release is being tuned behind the scenes."}</p>
              </div>
              <div className="relative mt-10 border-t border-white/20 pt-5 text-xs font-bold text-white/65">{data?.updates.length ?? 0} published releases</div>
            </div>
          </section>

          <section className="mt-16" aria-live="polite" aria-busy={loading}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#3d2f25]/15 pb-5">
              <div><p className="font-mono text-xs font-bold uppercase tracking-[.15em] text-primary">01 / Changelog</p><h2 className="mt-2 text-4xl font-bold tracking-[-.055em] text-[#211c18] sm:text-5xl">The release archive</h2></div>
              {!loading && latest && <p className="font-mono text-xs font-bold text-[#887c72]">Newest first</p>}
            </div>

            {loading ? <UpdatesSkeleton /> : error ? (
              <EmptyState icon={AlertCircle} title="Couldn’t load updates" description="The changelog service did not respond. Try again to see the latest releases." action={<button onClick={fetchUpdates} className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-[#1d1a17] px-5 text-sm font-bold text-[#fff8ed]"><RefreshCw className="size-4" aria-hidden="true" />Try again</button>} />
            ) : !data?.enabled ? (
              <EmptyState icon={History} title="Changelog taking a break" description="Updates are temporarily hidden while we prepare the next release. Check back soon." />
            ) : data.updates.length === 0 ? (
              <EmptyState icon={Sparkles} title="The first update is on its way" description="There are no release notes yet, but something new is being tuned." />
            ) : (
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="space-y-5">
                  {data.updates.map((update, index) => (
                    <article key={update._id} className={`group grid overflow-hidden rounded-[2rem] border border-[#3d2f25]/13 shadow-[0_14px_40px_rgba(65,43,27,.06)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(65,43,27,.12)] sm:grid-cols-[6rem_1fr] ${index === 0 ? "bg-[#1d1a17] text-[#fff8ed]" : "bg-[#fffaf2]/78 text-[#211c18]"}`}>
                      <div className={`flex items-center justify-between border-b p-5 sm:flex-col sm:items-start sm:justify-start sm:border-b-0 sm:border-r sm:p-6 ${index === 0 ? "border-white/10" : "border-[#3d2f25]/12"}`}>
                        <span className={`font-mono text-xs font-bold ${index === 0 ? "text-white/45" : "text-[#9b8f85]"}`}>{String(index + 1).padStart(2, "0")}</span>
                        <Tag className={`size-5 sm:mt-auto ${index === 0 ? "text-[#ff6257]" : "text-primary"}`} aria-hidden="true" />
                      </div>
                      <div className="p-6 sm:p-8">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className={`rounded-full px-3 py-1.5 font-mono text-xs font-bold ${index === 0 ? "bg-[#d83229] text-white" : "bg-primary/10 text-primary"}`}>{update.version}</span>
                          <time dateTime={update.createdAt} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${index === 0 ? "text-white/50" : "text-[#81756c]"}`}><CalendarDays className="size-3.5" aria-hidden="true" />{formatDate(update.createdAt)}</time>
                          {index === 0 && <span className="rounded-full border border-white/15 px-3 py-1 text-[.65rem] font-extrabold uppercase tracking-[.08em] text-white/70">Latest</span>}
                        </div>
                        <h3 className="mt-5 text-2xl font-bold tracking-[-.04em] sm:text-3xl">{update.title}</h3>
                        <div className={`mt-4 whitespace-pre-wrap text-sm leading-7 sm:text-base ${index === 0 ? "text-white/62" : "text-[#6d635b]"}`}>{update.content}</div>
                      </div>
                    </article>
                  ))}
                </div>
                <aside className="h-fit rounded-[1.75rem] border border-[#3d2f25]/13 bg-[#fffaf2]/75 p-6 lg:sticky lg:top-28" aria-label="Changelog information">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><History className="size-5" aria-hidden="true" /></span>
                  <h3 className="mt-5 text-xl font-bold tracking-[-.03em]">Questions about a change?</h3>
                  <p className="mt-2 text-sm leading-6 text-[#71675f]">Our support team can help with new behavior, migrations, or feedback.</p>
                  <Link href="/support" className="mt-5 inline-flex min-h-11 items-center gap-2 border-b-2 border-primary text-sm font-bold text-[#29231f] hover:text-primary">Visit support<ArrowRight className="size-4" aria-hidden="true" /></Link>
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

function formatDate(value: string) { return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }); }

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof Sparkles; title: string; description: string; action?: React.ReactNode }) {
  return <div className="rounded-[2rem] border border-[#3d2f25]/13 bg-[#fffaf2]/75 px-6 py-16 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-7" aria-hidden="true" /></span><h2 className="mt-5 text-2xl font-bold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71675f]">{description}</p>{action && <div className="mt-6">{action}</div>}</div>;
}

function UpdatesSkeleton() {
  return <div className="space-y-5" role="status"><span className="sr-only">Loading updates</span>{[0, 1, 2].map((item) => <div key={item} className="animate-pulse rounded-[2rem] border border-[#3d2f25]/12 bg-[#fffaf2]/70 p-7"><div className="h-6 w-24 rounded-full bg-muted" /><div className="mt-5 h-8 max-w-sm rounded-full bg-muted" /><div className="mt-4 space-y-2"><div className="h-3 w-full rounded-full bg-muted" /><div className="h-3 w-4/5 rounded-full bg-muted" /></div></div>)}</div>;
}
