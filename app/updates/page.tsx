"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Sparkles, Calendar, Tag, AlertCircle } from "lucide-react";

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

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch("/api/updates");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch updates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Header />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">
                Changelog
              </span>
            </div>
            <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
              Updates & Releases
            </h1>
            <p className="text-zinc-400">
              Stay up to date with the latest features and improvements
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            </div>
          ) : !data?.enabled ? (
            /* Page Disabled State */
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
              <h2 className="mb-2 text-xl font-semibold text-white">
                Updates Page Unavailable
              </h2>
              <p className="text-zinc-400">
                The updates page is currently disabled. Please check back later.
              </p>
            </div>
          ) : data.updates.length === 0 ? (
            /* No Updates State */
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
              <h2 className="mb-2 text-xl font-semibold text-white">
                No Updates Yet
              </h2>
              <p className="text-zinc-400">
                Check back soon for the latest updates and releases.
              </p>
            </div>
          ) : (
            /* Updates Timeline */
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-cyan-500/50 via-cyan-500/20 to-transparent sm:left-6" />

              {/* Updates list */}
              <div className="space-y-8">
                {data.updates.map((update, index) => (
                  <div key={update._id} className="relative pl-12 sm:pl-16">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-2 top-2 h-4 w-4 rounded-full border-2 sm:left-4 ${
                        index === 0
                          ? "border-cyan-400 bg-cyan-400"
                          : "border-zinc-600 bg-zinc-900"
                      }`}
                    />

                    {/* Update card */}
                    <div
                      className={`rounded-xl border p-6 transition-colors ${
                        index === 0
                          ? "border-cyan-500/30 bg-cyan-500/5"
                          : "border-white/10 bg-zinc-900/50"
                      }`}
                    >
                      {/* Meta info */}
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-400">
                          <Tag className="h-3 w-3" />
                          {update.version}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(update.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                        {index === 0 && (
                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            Latest
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="mb-2 text-lg font-semibold text-white">
                        {update.title}
                      </h3>

                      {/* Content */}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                        {update.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
