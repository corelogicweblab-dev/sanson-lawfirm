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

function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (mem !== undefined && mem < 4) return true;
  const cores = navigator.hardwareConcurrency;
  if (cores !== undefined && cores <= 2) return true;
  return false;
}

export function detectMotionTier(): MotionTier {
  if (prefersReducedMotion()) return "minimal";
  if (isSlowConnection() || isLowEndDevice()) return "reduced";
  return "full";
}

export function shouldUseRichMedia(): boolean {
  return detectMotionTier() === "full";
}
