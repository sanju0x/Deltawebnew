"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Newspaper, X } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

const DISMISSED_NEWS_KEY = "dismissed_news_id";

export function NewsPopup() {
  const pathname = usePathname();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const controller = new AbortController();

    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news", {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = (await response.json()) as NewsItem | null;

        if (
          data?._id &&
          localStorage.getItem(DISMISSED_NEWS_KEY) !== data._id
        ) {
          setNews(data);
          revealTimerRef.current = setTimeout(() => setIsOpen(true), 100);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Failed to fetch news:", error);
      }
    };

    fetchNews();

    return () => {
      controller.abort();
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    };
  }, [pathname]);

  const handleClose = () => {
    if (!news) return;

    localStorage.setItem(DISMISSED_NEWS_KEY, news._id);
    setIsOpen(false);
    cleanupTimerRef.current = setTimeout(() => setNews(null), 220);
  };

  if (pathname.startsWith("/admin") || !news) return null;

  const publishedDate = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(news.createdAt));

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-1.25rem)] max-w-2xl gap-0 overflow-hidden rounded-[2rem] border-primary/20 bg-card p-0 text-card-foreground shadow-[0_32px_90px_rgba(62,31,18,0.32)] sm:max-w-2xl"
      >
        <header className="relative overflow-hidden bg-primary px-5 py-5 text-primary-foreground sm:px-8 sm:py-7">
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-16 h-44 w-44 rounded-full border-[2rem] border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-16 left-1/3 h-28 w-28 rounded-full bg-black/10 blur-2xl"
          />

          <div className="relative flex items-center gap-3 pr-12">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/15 shadow-inner">
              <Newspaper aria-hidden="true" className="size-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/75">
                Delta dispatch
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                The latest from our team
              </p>
            </div>
          </div>

          <DialogClose
            aria-label="Dismiss news announcement"
            className="absolute right-4 top-4 grid size-11 cursor-pointer place-items-center rounded-full border border-white/20 bg-black/10 text-white transition-colors duration-200 hover:bg-black/20 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-6 sm:top-6"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={2.25} />
          </DialogClose>
        </header>

        <div className="px-5 pb-5 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
              Latest news
            </span>
            <time
              className="text-xs font-semibold text-muted-foreground"
              dateTime={news.createdAt}
            >
              {publishedDate}
            </time>
          </div>

          <DialogTitle className="mt-4 max-w-[20ch] text-2xl font-bold leading-[1.08] tracking-[-0.035em] text-card-foreground sm:text-4xl">
            {news.title}
          </DialogTitle>

          <DialogDescription asChild>
            <div className="mt-4 max-h-[min(38dvh,18rem)] overflow-y-auto overscroll-contain whitespace-pre-wrap pr-2 text-base leading-7 text-muted-foreground [scrollbar-color:color-mix(in_oklab,var(--primary)_45%,transparent)_transparent]">
              {news.content}
            </div>
          </DialogDescription>

          <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xs text-xs leading-5 text-muted-foreground">
              You’ll only see each announcement once after dismissing it.
            </p>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-extrabold text-background shadow-[0_10px_24px_rgba(29,26,23,0.18)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_14px_30px_rgba(216,50,41,0.24)] sm:w-auto"
              >
                Got it
                <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
              </button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
