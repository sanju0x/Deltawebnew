import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { getDiscordAuthConfiguration } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin sign in | Delta",
  description: "Secure sign in for the Delta administration panel.",
};

const errorMessages: Record<string, { title: string; message: string }> = {
  configuration: {
    title: "OAuth configuration is incomplete",
    message: "Check the missing Vercel environment variables below, then redeploy the project.",
  },
  invalid_state: {
    title: "Sign-in session expired",
    message: "The security check expired or did not match. Start a new Discord sign-in.",
  },
  oauth_failed: {
    title: "Discord rejected the sign-in",
    message: "Confirm that the client secret and OAuth redirect URL match your Discord application.",
  },
  profile_failed: {
    title: "Discord profile unavailable",
    message: "We could not read your Discord identity. Please try again in a moment.",
  },
  not_allowed: {
    title: "Account not authorized",
    message: "This Discord user ID is not included in the admin allow list.",
  },
  unavailable: {
    title: "Discord is temporarily unavailable",
    message: "The connection could not be completed. Please try again.",
  },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; missing?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const configuration = getDiscordAuthConfiguration();
  const error = query.error ? errorMessages[query.error] : undefined;
  const displayedError = error ?? (!configuration.configured ? errorMessages.configuration : undefined);
  const missing = query.missing?.split(",").filter(Boolean) ?? configuration.missing;

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-[-8rem] size-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-24 bottom-[-9rem] size-96 rounded-full bg-[#5865f2]/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <section className="relative w-full max-w-md" aria-labelledby="login-heading">
        <Link
          href="/"
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Delta
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/95 shadow-2xl shadow-foreground/10 backdrop-blur-xl">
          <div className="border-b border-border/70 bg-secondary/35 px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <BrandLogo compact />
                  <p className="mt-0.5 pl-[3.25rem] text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Administration
                  </p>
                </div>
              </div>
              <span className="grid size-10 place-items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" title="Protected admin area">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-9">
            <div className="mb-7">
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <LockKeyhole className="size-6" aria-hidden="true" />
              </div>
              <h1 id="login-heading" className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-2 leading-6 text-muted-foreground">
                Continue with an authorized Discord account to manage Delta.
              </p>
            </div>

            {displayedError && (
              <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/8 p-4" role="alert">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-foreground">{displayedError.title}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{displayedError.message}</p>
                    {(!configuration.configured || query.error === "configuration") && missing.length > 0 && (
                      <ul className="mt-3 space-y-1 font-mono text-xs text-destructive">
                        {missing.map((name) => <li key={name}>Missing: {name}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {configuration.configured ? (
              <a
                href="/api/auth/discord/login"
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#5865f2] px-5 text-sm font-semibold text-white shadow-lg shadow-[#5865f2]/20 transition-[background-color,box-shadow] hover:bg-[#4752c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2] focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <DiscordMark />
                Continue with Discord
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#5865f2]/50 px-5 text-sm font-semibold text-white opacity-60"
              >
                <DiscordMark />
                Continue with Discord
              </button>
            )}

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-secondary/50 p-3.5 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <p>Discord only shares your user ID and basic profile. Access is limited to approved administrators.</p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Protected by a signed, HTTP-only admin session.
        </p>
      </section>
    </main>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="currentColor">
      <path d="M19.54 5.34A17.5 17.5 0 0 0 15.22 4l-.53 1.08a16.1 16.1 0 0 0-5.36 0L8.79 4a17.7 17.7 0 0 0-4.33 1.35C1.72 9.4.98 13.35 1.35 17.24a17.6 17.6 0 0 0 5.3 2.68l1.3-1.78a11.4 11.4 0 0 1-2.04-.98l.5-.38c3.94 1.83 8.21 1.83 12.1 0l.51.38c-.65.39-1.34.72-2.05.98l1.3 1.78a17.5 17.5 0 0 0 5.3-2.68c.43-4.52-.73-8.43-4.03-11.9ZM8.68 14.82c-1.18 0-2.15-1.08-2.15-2.4 0-1.33.95-2.41 2.15-2.41 1.2 0 2.17 1.09 2.15 2.4 0 1.33-.95 2.41-2.15 2.41Zm6.64 0c-1.18 0-2.15-1.08-2.15-2.4 0-1.33.95-2.41 2.15-2.41 1.2 0 2.17 1.09 2.15 2.4 0 1.33-.95 2.41-2.15 2.41Z" />
    </svg>
  );
}
