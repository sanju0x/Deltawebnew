"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import type { TrialStatus } from "@/lib/trial-api";

type Status = TrialStatus & { userId: string };

export default function TrialPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [expectedUser, setExpectedUser] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/trial", { cache: "no-store" });
      if (response.status === 401) { setStatus(null); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(data);
    } catch { setError("The trial service is unavailable. Please try again shortly."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setExpectedUser(params.get("user") || "");
    if (params.get("error")) setError(params.get("error") === "configuration" ? "Discord login is not configured yet. Please contact Delta support." : "Discord login was cancelled or expired. Please sign in again.");
    void load();
  }, []);

  async function claim() {
    setClaiming(true); setError("");
    try {
      const response = await fetch("/api/trial", { method: "POST" });
      const data = await response.json();
      if (response.status === 401) { setStatus(null); throw new Error("Your session expired. Sign in again."); }
      if (!response.ok && response.status !== 409) throw new Error(data.error || "Could not claim your trial.");
      setStatus(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not claim your trial."); }
    finally { setClaiming(false); }
  }

  async function switchAccount() {
    setClaiming(true); setError("");
    try {
      const response = await fetch("/api/trial/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      window.location.assign(`/api/trial/login${expectedUser ? `?user=${encodeURIComponent(expectedUser)}` : ""}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not sign out."); setClaiming(false); }
  }

  const mismatch = !!status && !!expectedUser && status.userId !== expectedUser;
  const descriptions: Record<TrialStatus["code"], string> = {
    eligible: "Your personal offer is ready. Claim 30 days of no-prefix commands below.",
    active: `Your no-prefix trial is active${status?.endsAt ? ` until ${new Date(status.endsAt).toLocaleDateString()}` : ""}. Enjoy your music!`,
    permanent: "You already have permanent no-prefix access. No trial is needed.",
    disabled: "Free trial claims are currently paused. Please check back later.",
    no_offer: "You do not have a trial offer yet. Play music with Delta and look for your personal offer in Discord.",
    cooldown: `Your previous trial has ended. A new offer may appear after ${status?.nextOfferAt ? new Date(status.nextOfferAt).toLocaleDateString() : "your cooldown"}.`,
  };

  return (
    <main className="premium-page">
      <Header />
      <section className="site-container py-20 sm:py-28">
        <div className="mx-auto max-w-2xl rounded-3xl border border-current/10 bg-background p-7 shadow-sm sm:p-12">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#d83229]">Delta · Personal offer</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your music.<br />Without the prefix.</h1>
          <p className="mt-6 leading-relaxed opacity-75">Get 30 days of no-prefix commands. Sign in with the Discord account that received the offer, then claim your free trial.</p>
          <ul className="my-7 space-y-2 text-sm">
            <li>✓ Use supported commands without the server prefix</li>
            <li>✓ Personal access across servers where Delta is available</li>
            <li>✓ Expires automatically after 30 days; no payment required</li>
          </ul>
          <div aria-live="polite" className="space-y-5 border-t border-current/10 pt-6">
            {loading ? <p>Checking your trial…</p> : status ? <>
              <p className="break-all text-sm opacity-70">Signed in as Discord user {status.userId}</p>
              <p>{mismatch ? "This offer belongs to a different Discord account. Switch to the account that received it." : descriptions[status.code]}</p>
              {!mismatch && status.eligible && <button className="button-primary" disabled={claiming} onClick={() => void claim()}>{claiming ? "Claiming…" : "Claim my 30-day free trial"}</button>}
              <button className="button-secondary" disabled={claiming} onClick={() => void switchAccount()}>Switch Discord account</button>
            </> : <a className="button-primary" href={`/api/trial/login${expectedUser ? `?user=${encodeURIComponent(expectedUser)}` : ""}`}>Sign in with Discord</a>}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {!loading && <button className="block text-sm underline opacity-70" disabled={claiming} onClick={() => { setError(""); void load(); }}>Refresh trial status</button>}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
