"use client";

import { useEffect, useState } from "react";
import { X, Newspaper } from "lucide-react";

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

export function NewsPopup() {
  const [news, setNews] = useState<NewsItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news");
        if (response.ok) {
          const data = await response.json();
          if (data && data._id) {
            // Check if user has already dismissed this news
            const dismissedNews = localStorage.getItem("dismissed_news_id");
            if (dismissedNews !== data._id) {
              setNews(data);
              // Small delay to trigger animation
              setTimeout(() => setIsVisible(true), 100);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      }
    };

    fetchNews();
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (news) {
        localStorage.setItem("dismissed_news_id", news._id);
      }
      setIsVisible(false);
      setNews(null);
    }, 200);
  };

  if (!news || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md transform rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl transition-all duration-200 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
            <Newspaper className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
              Latest News
            </p>
            <h2 className="text-lg font-semibold text-white">{news.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
          {news.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {new Date(news.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <button
            onClick={handleClose}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
