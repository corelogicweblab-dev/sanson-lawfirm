"use client";

import { useMotion } from "@/components/providers/motion-provider";

/**
 * Global futuristic pink atmosphere — CSS-only, GPU transforms, 20–60s cycles.
 * Rendered once in AppProviders so every route shares the same animated canvas.
 */
export function FuturisticBackground() {
  const { tier } = useMotion();
  const isFull = tier === "full";
  const isReduced = tier === "reduced";
  const showOrbs = tier !== "minimal";
  const showExtras = isFull;

  return (
    <div
      className="sanson-app-bg"
      data-motion-bg={tier}
      aria-hidden
    >
      <div className="sanson-bg-gradient-shift" />
      <div className="sanson-mesh-grid" />
      <div className="sanson-depth-veil" />

      {showOrbs && (
        <>
          <div className="sanson-blob sanson-blob-1" />
          <div className="sanson-blob sanson-blob-2" />
          <div className="sanson-blob sanson-blob-3" />
          <div className="sanson-blob sanson-blob-4" />
          <div className="sanson-blob sanson-blob-5" />
        </>
      )}

      {showExtras && (
        <>
          <div className="sanson-aurora sanson-aurora-a" />
          <div className="sanson-aurora sanson-aurora-b" />
          <div className="sanson-grid-scan" />
          <div className="sanson-floating-wave sanson-floating-wave-1" />
          <div className="sanson-floating-wave sanson-floating-wave-2" />
          <div className="sanson-light-sweep" />
        </>
      )}

      {(isFull || isReduced) && <div className="sanson-wave" />}
      <div className="sanson-ambient-top" />
    </div>
  );
}
