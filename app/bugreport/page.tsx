"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Bug, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const categories = [
  { value: "playback", label: "Playback Issues" },
  { value: "commands", label: "Command Errors" },
  { value: "audio", label: "Audio Quality" },
  { value: "permissions", label: "Permission Problems" },
  { value: "ui", label: "Dashboard/UI" },
  { value: "other", label: "Other" },
];

const severities = [
  { value: "low", label: "Low", description: "Minor issue, doesn't affect usage" },
  { value: "medium", label: "Medium", description: "Noticeable issue, has workaround" },
  { value: "high", label: "High", description: "Major issue, affects functionality" },
  { value: "critical", label: "Critical", description: "Bot is unusable or crashes" },
];

export default function BugReportPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    severity: "medium",
    email: "",
    discordUsername: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const supabase = createClient();
      
      const { error } = await supabase.from("bug_reports").insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
        reporter_email: formData.email || null,
        reporter_discord_username: formData.discordUsername || null,
      });

      if (error) throw error;

      setSubmitStatus("success");
      setFormData({
        title: "",
        description: "",
        category: "other",
        severity: "medium",
        email: "",
        discordUsername: "",
      });
    } catch (err) {
      console.error("Error submitting bug report:", err);
      setSubmitStatus("error");
      setErrorMessage("Failed to submit bug report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/20 mb-6">
              <Bug className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Report a <span className="text-primary">Bug</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Found something wrong? Let us know and we&apos;ll fix it as soon as possible.
            </p>
          </div>

          {submitStatus === "success" ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-3xl p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-6">
                Your bug report has been submitted successfully. Our team will review it shortly.
              </p>
              <Button
                onClick={() => setSubmitStatus("idle")}
                className="rounded-full bg-secondary hover:bg-primary text-foreground hover:text-primary-foreground"
              >
                Submit Another Report
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitStatus === "error" && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-red-400">{errorMessage}</p>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-foreground">
                  Bug Title <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="w-full bg-card border border-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              {/* Category & Severity */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-medium text-foreground">
                    Category <span className="text-primary">*</span>
                  </label>
                  <select
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-card border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="severity" className="block text-sm font-medium text-foreground">
                    Severity <span className="text-primary">*</span>
                  </label>
                  <select
                    id="severity"
                    required
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full bg-card border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    {severities.map((sev) => (
                      <option key={sev.value} value={sev.value}>
                        {sev.label} - {sev.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-foreground">
                  Description <span className="text-primary">*</span>
                </label>
                <textarea
                  id="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please describe the bug in detail. Include steps to reproduce, expected behavior, and actual behavior."
                  className="w-full bg-card border border-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full bg-card border border-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="discord" className="block text-sm font-medium text-foreground">
                    Discord Username <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="discord"
                    value={formData.discordUsername}
                    onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                    placeholder="username#0000"
                    className="w-full bg-card border border-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Bug Report"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
