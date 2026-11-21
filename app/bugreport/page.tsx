"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Bug, Check, CheckCircle2, ChevronDown, Loader2, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const categories = [
  { value: "playback", label: "Playback issues" },
  { value: "commands", label: "Command errors" },
  { value: "audio", label: "Audio quality" },
  { value: "permissions", label: "Permission problems" },
  { value: "ui", label: "Dashboard / UI" },
  { value: "other", label: "Something else" },
];

const severities = [
  { value: "low", label: "Low", description: "Minor issue; listening still works" },
  { value: "medium", label: "Medium", description: "Noticeable, but there is a workaround" },
  { value: "high", label: "High", description: "A major feature is not working" },
  { value: "critical", label: "Critical", description: "Delta is unusable or repeatedly crashes" },
];

const initialForm = { title: "", description: "", category: "other", severity: "medium", email: "", discordUsername: "" };

export default function BugReportPage() {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");
    try {
      const response = await fetch("/api/bug-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!response.ok) throw new Error("Submit failed");
      setSubmitStatus("success");
      setFormData(initialForm);
    } catch (error) {
      console.error("Error submitting bug report:", error);
      setSubmitStatus("error");
      setErrorMessage("We couldn’t send your report. Please check your connection and try again.");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />
      <main id="main-content" className="relative flex-1 overflow-hidden pb-24 pt-32 sm:pt-36">
        <div className="pointer-events-none absolute -left-32 top-20 size-[30rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="site-container relative">
          <section className="mb-12 max-w-4xl" aria-labelledby="bug-heading">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em] text-primary"><Bug className="size-4" aria-hidden="true" />Bug report</p>
            <h1 id="bug-heading" className="mt-5 max-w-[11ch] text-6xl font-bold leading-[.88] tracking-[-.075em] text-[#1d1a17] sm:text-7xl lg:text-[6.5rem]">Found a glitch? <span className="text-primary">Let’s squash it.</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#685f57] sm:text-lg">Tell us what happened and how to reproduce it. Clear details help the team move from report to fix much faster.</p>
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-8">
            <aside className="overflow-hidden rounded-[2rem] bg-[#1d1a17] p-6 text-[#fff8ed] shadow-[0_24px_60px_rgba(65,43,27,.18)] lg:sticky lg:top-28 sm:p-7" aria-label="How bug reports work">
              <div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-primary text-white"><ShieldCheck className="size-6" aria-hidden="true" /></span><span className="font-mono text-[.65rem] font-bold uppercase tracking-[.14em] text-white/40">Fast triage</span></div>
              <h2 className="mt-8 text-3xl font-bold leading-[1] tracking-[-.05em]">A useful report has three things.</h2>
              <ol className="mt-7 space-y-5">
                {[ ["01", "What you did", "The command or action that started it."], ["02", "What happened", "The exact result, message, or sound you noticed."], ["03", "What you expected", "What Delta should have done instead."] ].map(([number, title, copy]) => (
                  <li key={number} className="grid grid-cols-[2rem_1fr] gap-3 border-t border-white/10 pt-4"><span className="font-mono text-xs font-bold text-[#ff6257]">{number}</span><div><strong className="text-sm">{title}</strong><p className="mt-1 text-xs leading-5 text-white/50">{copy}</p></div></li>
                ))}
              </ol>
              <p className="mt-8 rounded-2xl bg-white/6 p-4 text-xs leading-5 text-white/55">Please avoid passwords, tokens, private server details, or other sensitive information.</p>
            </aside>

            <section className="rounded-[2.25rem] border border-[#3d2f25]/13 bg-[#fffaf2]/78 p-5 shadow-[0_20px_55px_rgba(65,43,27,.08)] sm:p-8 lg:p-10" aria-labelledby="report-form-heading">
              {submitStatus === "success" ? (
                <div className="flex min-h-[36rem] flex-col items-center justify-center text-center" role="status">
                  <span className="grid size-20 place-items-center rounded-[1.75rem] bg-emerald-100 text-emerald-800"><CheckCircle2 className="size-10" aria-hidden="true" /></span>
                  <p className="mt-7 font-mono text-xs font-bold uppercase tracking-[.15em] text-emerald-700">Report received</p>
                  <h2 className="mt-3 text-4xl font-bold tracking-[-.055em] text-[#211c18]">Thanks for the signal.</h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[#70665e]">Your report is now in the team’s review queue. The details you shared will help us investigate it.</p>
                  <button type="button" onClick={() => setSubmitStatus("idle")} className="mt-7 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-[#1d1a17] px-6 text-sm font-bold text-[#fff8ed] transition-colors hover:bg-primary">Submit another report<ArrowRight className="size-4" aria-hidden="true" /></button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate={false}>
                  <div className="mb-8 border-b border-[#3d2f25]/13 pb-6"><p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-primary">Report details</p><h2 id="report-form-heading" className="mt-2 text-3xl font-bold tracking-[-.045em] text-[#211c18]">What went wrong?</h2><p className="mt-2 text-sm leading-6 text-[#756b62]"><span className="text-primary">*</span> Required fields</p></div>

                  {submitStatus === "error" && <div className="mb-6 flex gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 p-4 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><strong>Report not sent</strong><p className="mt-1 leading-5">{errorMessage}</p></div></div>}

                  <div className="space-y-7">
                    <Field label="Bug title" htmlFor="title" required helper="A short, specific summary."><input id="title" name="title" required maxLength={120} aria-describedby="title-help" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder="Example: /skip stops playback completely" className="delta-field" /></Field>

                    <div className="grid gap-6 md:grid-cols-2">
                      <Field label="Category" htmlFor="category" required helper="Where did you notice it?"><div className="relative"><select id="category" name="category" required aria-describedby="category-help" value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })} className="delta-field appearance-none pr-12">{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#80746b]" aria-hidden="true" /></div></Field>
                      <Field label="Discord username" htmlFor="discord" helper="Optional, if we need to follow up."><input id="discord" name="discordUsername" autoComplete="username" aria-describedby="discord-help" value={formData.discordUsername} onChange={(event) => setFormData({ ...formData, discordUsername: event.target.value })} placeholder="your_username" className="delta-field" /></Field>
                    </div>

                    <fieldset><legend className="text-sm font-extrabold text-[#2c2520]">Severity <span className="text-primary">*</span></legend><p className="mt-1 text-xs leading-5 text-[#81766d]">Choose the closest impact level.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{severities.map((severity) => { const selected = formData.severity === severity.value; return <label key={severity.value} className={`relative flex min-h-24 cursor-pointer gap-3 rounded-2xl border p-4 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/20 ${selected ? "border-primary bg-primary/8" : "border-[#3d2f25]/13 bg-[#fffaf2]/65 hover:border-primary/30"}`}><input type="radio" name="severity" value={severity.value} checked={selected} onChange={(event) => setFormData({ ...formData, severity: event.target.value })} className="sr-only" /><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-[#8f8379]"}`}>{selected && <Check className="size-3" aria-hidden="true" />}</span><span><strong className="block text-sm">{severity.label}</strong><span className="mt-1 block text-xs leading-5 text-[#796f66]">{severity.description}</span></span></label>; })}</div></fieldset>

                    <Field label="Description" htmlFor="description" required helper="Include steps, actual result, and expected result."><textarea id="description" name="description" required rows={7} maxLength={4000} aria-describedby="description-help" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} placeholder={"1. I joined a voice channel…\n2. I used /play…\n3. Delta responded…"} className="delta-field resize-y" /></Field>
                    <Field label="Email" htmlFor="email" helper="Optional. Used only to follow up about this report."><input type="email" id="email" name="email" autoComplete="email" inputMode="email" aria-describedby="email-help" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} placeholder="you@example.com" className="delta-field" /></Field>

                    <button type="submit" disabled={isSubmitting} className="inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-extrabold text-primary-foreground shadow-[0_12px_28px_rgba(216,50,41,.22)] transition-[background-color,box-shadow] hover:bg-[#c92d25] hover:shadow-[0_16px_34px_rgba(216,50,41,.28)] disabled:cursor-wait disabled:opacity-55">{isSubmitting ? <><Loader2 className="size-5 animate-spin" aria-hidden="true" />Sending report…</> : <>Send bug report<ArrowRight className="size-5" aria-hidden="true" /></>}</button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, htmlFor, helper, required, children }: { label: string; htmlFor: string; helper?: string; required?: boolean; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="block text-sm font-extrabold text-[#2c2520]">{label} {required && <span className="text-primary">*</span>}</label>{helper && <p id={`${htmlFor}-help`} className="mt-1 text-xs leading-5 text-[#81766d]">{helper}</p>}<div className="mt-2">{children}</div></div>;
}
