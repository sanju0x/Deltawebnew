import Image from "next/image";
import { BadgeCheck } from "lucide-react";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className = "" }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="brand-mark">
        <Image
          src="/icon.svg"
          alt=""
          width={compact ? 34 : 42}
          height={compact ? 34 : 42}
          priority
        />
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className={compact ? "text-lg font-bold" : "text-xl font-bold"}>
          Delta
        </span>
        <BadgeCheck
          className={compact ? "size-4 shrink-0 text-white drop-shadow-sm" : "size-5 shrink-0 text-white drop-shadow-sm"}
          fill="#5865f2"
          strokeWidth={2.4}
          aria-label="Verified on Discord"
        />
      </span>
    </span>
  );
}
