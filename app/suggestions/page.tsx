"use client";
import { useState, type FormEvent } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function SuggestionsPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !message.trim()) return;
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      if (!response.ok) throw Error((await response.json()).error || "Please try again.");
      setMessage(""); setNotice("Thanks! Your suggestion was sent to the Delta team.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not send your suggestion."); }
    finally { setBusy(false); }
  }
  return <><Header /><main className="mx-auto min-h-[80vh] max-w-2xl px-5 pb-20 pt-36">
    <MessageSquarePlus aria-hidden className="mb-5 size-9 text-primary" />
    <h1 className="text-4xl font-bold">Suggestions</h1>
    <p className="mt-3 text-muted-foreground">What would make Delta better for your server?</p>
    <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border bg-card p-6">
      <label htmlFor="idea" className="font-semibold">Your suggestion</label>
      <Textarea id="idea" rows={6} maxLength={2000} required disabled={busy} value={message} onChange={e => { setMessage(e.target.value); setNotice(""); }} />
      <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{message.length} / 2,000</span>
        <Button disabled={busy || !message.trim()}>{busy ? "Sending…" : "Send suggestion"}</Button></div>
      <p role="status">{notice}</p>
    </form>
  </main><Footer /></>;
}
