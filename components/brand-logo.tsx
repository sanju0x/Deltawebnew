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
          className={compact ? "size-4 text-[#5865f2]" : "size-5 text-[#5865f2]"}
          fill="currentColor"
          strokeWidth={2.4}
          aria-label="Verified on Discord"
        />
      </span>
    </span>
  );
}
