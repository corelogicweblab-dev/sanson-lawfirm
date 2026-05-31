import type { MotionTier } from "@sanson/ui";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } })
    .connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  const t = conn.effectiveType;
  return t === "slow-2g" || t === "2g" || t === "3g";
}

export function detectMotionTier(): MotionTier {
  if (prefersReducedMotion()) return "minimal";
  // Only reduce motion on very slow networks — avoid false positives on office laptops.
  if (isSlowConnection()) return "reduced";
  return "full";
}

export function shouldUseRichMedia(): boolean {
  return detectMotionTier() === "full";
}
