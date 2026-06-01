"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

type AppHeaderBrandProps = {
  href?: string;
  className?: string;
  onNavigate?: () => void;
};

/** Uniform firm branding — used in marketing, auth, and dashboard chrome. */
export function AppHeaderBrand({ href = "/", className, onNavigate }: AppHeaderBrandProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-0.5 transition hover:bg-white/5 sm:gap-3",
        className
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400 shadow-[0_0_16px_rgba(255,79,163,0.35)] transition group-hover:scale-105 sm:h-10 sm:w-10">
        <Scale className="h-4 w-4 text-white sm:h-5 sm:w-5" />
      </div>
      <span className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
        SANSON Legal OS
      </span>
    </Link>
  );
}
