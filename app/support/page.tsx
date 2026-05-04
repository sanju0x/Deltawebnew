"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { MessageCircle, Book, Mail, ExternalLink, HelpCircle, FileText, Zap } from "lucide-react";

const supportOptions = [
  {
    title: "Discord Server",
    description: "Join our community server for real-time help from our team and other users.",
    icon: MessageCircle,
    action: "Join Server",
    href: "#",
    color: "bg-[#5865F2]",
  },
  {
    title: "Documentation",
    description: "Browse our comprehensive docs to learn everything about Delta.",
    icon: Book,
    action: "View Docs",
    href: "#",
    color: "bg-primary",
  },
  {
    title: "Email Support",
    description: "Reach out to our support team directly for complex issues.",
    icon: Mail,
    action: "Send Email",
    href: "mailto:support@deltabot.com",
    color: "bg-green-600",
  },
];

const faqs = [
  {
    question: "How do I add Delta to my server?",
    answer: "Click the 'Add to Discord' button on our homepage and select the server you want to add Delta to. Make sure you have the 'Manage Server' permission.",
  },
  {
    question: "Why is Delta not responding to commands?",
    answer: "Ensure Delta has the necessary permissions in your server and channel. Check if the bot is online and try using /help to see available commands.",
  },
  {
    question: "How do I play music from Spotify?",
    answer: "Use the /play command followed by a Spotify track, album, or playlist URL. Delta will search and play the tracks from available sources.",
  },
  {
    question: "What audio quality does Delta support?",
    answer: "Delta supports up to 320kbps audio quality. Premium users get access to lossless audio when available.",
  },
  {
    question: "How do I set up 24/7 mode?",
    answer: "Premium users can enable 24/7 mode using the /247 command. This keeps Delta in your voice channel even when no music is playing.",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get <span className="text-primary">Support</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Need help? We&apos;re here for you. Choose your preferred way to get assistance.
            </p>
          </div>

          {/* Support Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {supportOptions.map((option) => (
              <div
                key={option.title}
                className="bg-card border border-border rounded-3xl p-8 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className={`${option.color} h-14 w-14 rounded-2xl flex items-center justify-center mb-6`}>
                  <option.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{option.title}</h3>
                <p className="text-muted-foreground mb-6">{option.description}</p>
                <Button
                  className="rounded-full bg-secondary hover:bg-primary text-foreground hover:text-primary-foreground transition-all"
                  asChild
                >
                  <a href={option.href} target="_blank" rel="noopener noreferrer">
                    {option.action}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4 mb-20">
            <a
              href="#"
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all group"
            >
              <div className="p-3 rounded-xl bg-secondary group-hover:bg-primary/20 transition-colors">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Getting Started</h4>
                <p className="text-sm text-muted-foreground">New to Delta? Start here</p>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all group"
            >
              <div className="p-3 rounded-xl bg-secondary group-hover:bg-primary/20 transition-colors">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Changelog</h4>
                <p className="text-sm text-muted-foreground">See what&apos;s new</p>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all group"
            >
              <div className="p-3 rounded-xl bg-secondary group-hover:bg-primary/20 transition-colors">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Status Page</h4>
                <p className="text-sm text-muted-foreground">Check bot status</p>
              </div>
            </a>
          </div>

          {/* FAQs */}
          <div>
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors"
                >
                  <h3 className="font-semibold text-foreground mb-2 flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground pl-8">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
