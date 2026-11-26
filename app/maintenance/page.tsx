"use client";

import { useEffect } from "react";
import { useMaintenance } from "@/components/maintenance-gate";

export default function MaintenancePage() {
  const { canBypass } = useMaintenance();
  useEffect(() => {
    if (canBypass) {
      // A server rewrite still contains the maintenance page until a full request
      // loads the original URL with the newly granted tester access.
      window.location.replace(window.location.pathname === "/maintenance" ? "/" : window.location.href);
    }
  }, [canBypass]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-bold">Under maintenance</h1>
        <p className="mt-3 text-muted-foreground">We’re making improvements to the Delta website. Please check back soon.</p>
        <p className="mt-3 text-muted-foreground">Approved beta testers can sign in with Discord to continue. Contact an admin to request access.</p>
        <a className="button-primary mt-5 inline-block" href="/api/dashboard/login?view=home">Sign in with Discord</a>
      </div>
    </main>
  );
}
