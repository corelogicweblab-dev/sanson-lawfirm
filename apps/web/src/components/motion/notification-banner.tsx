"use client";

import { motionNotification } from "@sanson/ui";
import { cn } from "@/lib/utils";
import { useMotion } from "@/components/providers/motion-provider";

interface NotificationBannerProps {
  children: React.ReactNode;
  className?: string;
}

/** Lightweight toast/banner — slide + fade, 150ms */
export function NotificationBanner({ children, className }: NotificationBannerProps) {
  const { tier } = useMotion();
  return (
    <div
      role="status"
      className={cn(
        tier !== "minimal" && motionNotification(),
        "rounded-xl border border-pink-500/25 bg-pink-500/10 px-4 py-3 text-sm text-pink-100",
        className
      )}
    >
      {children}
    </div>
  );
}
