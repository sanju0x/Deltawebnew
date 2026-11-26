export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-bold">Under maintenance</h1>
        <p className="mt-3 text-muted-foreground">We’re making improvements to the Delta website. Please check back soon.</p>
        <p className="mt-3 text-muted-foreground">Beta testers can sign in with Discord to continue.</p>
        <a className="button-primary mt-5 inline-block" href="/api/dashboard/login?view=home">Sign in with Discord</a>
      </div>
    </main>
  );
}
