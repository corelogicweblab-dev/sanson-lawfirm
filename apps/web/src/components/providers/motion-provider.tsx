"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MotionTier } from "@sanson/ui";
import { detectMotionTier } from "@/lib/motion/detect-tier";

interface MotionContextValue {
  tier: MotionTier;
  prefersReducedMotion: boolean;
  enableBlur: boolean;
  enableGlow: boolean;
  enablePageMotion: boolean;
  refreshTier: () => void;
}

const MotionContext = createContext<MotionContextValue>({
  tier: "full",
  prefersReducedMotion: false,
  enableBlur: true,
  enableGlow: true,
  enablePageMotion: true,
  refreshTier: () => {},
});

export function useMotion() {
  return useContext(MotionContext);
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<MotionTier>("full");

  const refreshTier = useCallback(() => {
    setTier(detectMotionTier());
  }, []);

  useEffect(() => {
    refreshTier();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => refreshTier();
    mq.addEventListener("change", onChange);

    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
    conn?.addEventListener?.("change", onChange);

    return () => mq.removeEventListener("change", onChange);
  }, [refreshTier]);

  useEffect(() => {
    document.documentElement.dataset.motionTier = tier;
    document.documentElement.style.setProperty(
      "--motion-duration",
      tier === "minimal" ? "0ms" : tier === "reduced" ? "150ms" : "200ms"
    );
  }, [tier]);

  const value = useMemo<MotionContextValue>(() => {
    const prefersReducedMotion = tier === "minimal";
    return {
      tier,
      prefersReducedMotion,
      enableBlur: tier === "full",
      enableGlow: tier !== "minimal",
      enablePageMotion: tier === "full",
      refreshTier,
    };
  }, [tier, refreshTier]);

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
