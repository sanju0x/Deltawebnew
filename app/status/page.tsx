"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

type BotStatusType = "online" | "offline" | "maintenance";

interface BotStatus {
  status: BotStatusType;
  message: string;
  updatedAt: string;
}

const statusConfig = {
  online: {
    icon: CheckCircle2,
    label: "Operational",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    pulseColor: "bg-emerald-400",
  },
  offline: {
    icon: XCircle,
    label: "Offline",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/30",
    pulseColor: "bg-red-400",
  },
  maintenance: {
    icon: AlertTriangle,
    label: "Maintenance",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    pulseColor: "bg-amber-400",
  },
};

export default function StatusPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await fetch("/api/bot-status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchStatus(), 30000);
    return () => clearInterval(interval);
  }, []);

  const config = status ? statusConfig[status.status] : statusConfig.online;
  const StatusIcon = config.icon;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Header />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
              Bot Status
            </h1>
            <p className="text-zinc-400">
              Current operational status of Delta Bot
            </p>
          </div>

          {/* Status Card */}
          <div
            className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-8`}
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : (
              <>
                {/* Status Indicator */}
                <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-4">
                    {/* Pulse indicator */}
                    <div className="relative flex h-4 w-4 items-center justify-center">
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.pulseColor} opacity-75`}
                      />
                      <span
                        className={`relative inline-flex h-3 w-3 rounded-full ${config.pulseColor}`}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-8 w-8 ${config.color}`} />
                      <div>
                        <h2 className={`text-2xl font-bold ${config.color}`}>
                          {config.label}
                        </h2>
                        <p className="text-sm text-zinc-400">Delta Bot</p>
                      </div>
                    </div>
                  </div>

                  {/* Refresh button */}
                  <button
                    onClick={() => fetchStatus(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </button>
                </div>

                {/* Message */}
                {status?.message && (
                  <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
                    <p className="text-sm font-medium text-zinc-300">
                      Status Message
                    </p>
                    <p className="mt-1 text-zinc-400">{status.message}</p>
                  </div>
                )}

                {/* Last Updated */}
                {status?.updatedAt && (
                  <p className="mt-6 text-center text-xs text-zinc-500">
                    Last updated:{" "}
                    {new Date(status.updatedAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 rounded-xl border border-white/10 bg-zinc-900/50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              What do the statuses mean?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <p className="text-sm text-zinc-300">
                  <span className="font-medium text-emerald-400">
                    Operational
                  </span>{" "}
                  - Bot is running normally
                </p>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <p className="text-sm text-zinc-300">
                  <span className="font-medium text-amber-400">
                    Maintenance
                  </span>{" "}
                  - Scheduled maintenance in progress
                </p>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-400" />
                <p className="text-sm text-zinc-300">
                  <span className="font-medium text-red-400">Offline</span> -
                  Bot is currently unavailable
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
