"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 1300);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="loading-screen" aria-label="Loading Delta">
      <div className="loading-mark">
        <Image src="/icon.svg" alt="Delta" width={88} height={88} priority />
      </div>
      <span className="loading-word">DELTA</span>
      <span className="loading-line" aria-hidden="true" />
    </div>
  );
}
