"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { PageBanner } from "@/components/page-banner";
import { Footer } from "@/components/footer";
import { Ticket } from "lucide-react";
import type { TrialStatus } from "@/lib/trial-types";

export default function TrialPage() {
  const [status, setStatus] = useState<(TrialStatus & { userId: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
    const reason = new URLSearchParams(window.location.search).get("error");
    if (reason) setError(reason === "configuration" ? "Discord login is not configured yet." : reason === "claim" ? "Your Discord account is connected, but the claim failed. Please try claiming again." : "Discord login was cancelled or expired. Please sign in again.");
    void load();
  }, []);
  async function claim() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/trial", { method: "POST" });
      const data = await response.json();
      if (response.status === 401) { setStatus(null); throw new Error("Your session expired. Sign in again."); }
      if (!response.ok && response.status !== 409) throw new Error(data.error || "Could not claim your trial.");
      setStatus(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not claim your trial."); }
    finally { setBusy(false); }
  }
  async function switchAccount() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/trial/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      window.location.assign("/api/trial/login");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not sign out."); setBusy(false); }
  }
  const descriptions: Record<TrialStatus["code"], string> = {
    eligible: "Claim your free month below. Each Discord account can claim once.",
    active: `Your no-prefix trial is active${status?.endsAt ? ` until ${new Date(status.endsAt).toLocaleString()}` : ""}. Enjoy your music!`,
    disabled: "Trial claims or access for this account are currently disabled. Contact Delta support if needed.",
    used: "You have already used your free trial. Only an admin can reset your claim eligibility.",
  };
  return <main className="premium-page">
    <Header />
    <section className="site-container pb-20 pt-28" aria-labelledby="trial-title">
      <PageBanner icon={Ticket} title="No-Prefix Trial" headingId="trial-title"
        description="Play music without typing a command prefix. Your first 30 days are free." />
      <div className="trial-claim-panel">
        <h2>Claim your free month</h2>
        <p className="mt-3 text-muted-foreground">Authorize with Discord to claim your trial. Each account can claim once. No payment required.</p>
        <p className="my-7 text-sm opacity-75">Access ends automatically after 30 days. Delta will send you a DM when your trial ends, if your Discord settings allow messages.</p>
        <div aria-live="polite" className="space-y-5 border-t border-current/10 pt-6">
          {loading ? <p>Checking your trial…</p> : status ? <>
            <p className="break-all text-sm opacity-70">Connected Discord account: {status.userId}</p>
            <p>{descriptions[status.code]}</p>
            {status.eligible && <button className="button-primary" disabled={busy} onClick={() => void claim()}>{busy ? "Claiming…" : "Claim my free month"}</button>}
            <button className="button-secondary" disabled={busy} onClick={() => void switchAccount()}>Switch Discord account</button>
          </> : <a className="button-primary" href="/api/trial/login">Authorize with Discord &amp; claim now</a>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {!loading && <button className="block text-sm underline opacity-70" disabled={busy} onClick={() => { setError(""); void load(); }}>Refresh trial status</button>}
        </div>
      </div>
    </section>
    <Footer />
  </main>;
}
