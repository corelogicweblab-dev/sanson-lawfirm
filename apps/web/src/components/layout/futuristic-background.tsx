"use client";

import { useMotion } from "@/components/providers/motion-provider";

/**
 * Global holographic pink atmosphere — always animated (scan lines, hex grid, particles).
 * Motion tier only slows intensity; never hides the moving background entirely.
 */
export function FuturisticBackground() {
  const { tier } = useMotion();
  const isMinimal = tier === "minimal";

  return (
    <div className="sanson-app-bg" data-motion-bg={tier} aria-hidden>
      <div className="sanson-bg-gradient-shift" />
      <div className="sanson-bg-gradient-flow" />
      <div className="sanson-mesh-grid" />
      <div className="sanson-holo-floor" />
      <div className="sanson-hex-mesh" />
      <div className="sanson-grid-scan" />
      <div className="sanson-grid-scan sanson-grid-scan-2" />
      <div className="sanson-particle-field" />
      <div className="sanson-particle-field sanson-particle-field-b" />
      <div className="sanson-scan-beam sanson-scan-beam-h" />
      <div className="sanson-scan-beam sanson-scan-beam-h sanson-scan-beam-h-2" />
      <div className="sanson-scan-beam sanson-scan-beam-v" />
      <div className="sanson-depth-veil" />

      <div className="sanson-bg-fx">
        <div className="sanson-bg-gradient-flow-b" />
        <div className="sanson-shimmer" />
        <div className="sanson-lens-flare sanson-lens-flare-1" />
        <div className="sanson-lens-flare sanson-lens-flare-2" />
        <div className="sanson-bokeh-layer" />

        {!isMinimal && (
          <>
            <div className="sanson-blob sanson-blob-1" />
            <div className="sanson-blob sanson-blob-2" />
            <div className="sanson-blob sanson-blob-3" />
            <div className="sanson-blob sanson-blob-4" />
            <div className="sanson-blob sanson-blob-5" />
            <div className="sanson-blob sanson-blob-6" />
            <div className="sanson-blob sanson-blob-7" />

            <div className="sanson-conic-glow" />
            <div className="sanson-orbit-ring sanson-orbit-ring-1" />
            <div className="sanson-orbit-ring sanson-orbit-ring-2" />
            <div className="sanson-energy-pulse sanson-energy-pulse-1" />
            <div className="sanson-energy-pulse sanson-energy-pulse-2" />
            <div className="sanson-energy-pulse sanson-energy-pulse-3" />

            <div className="sanson-aurora sanson-aurora-a" />
            <div className="sanson-aurora sanson-aurora-b" />
            <div className="sanson-aurora sanson-aurora-c" />

            <div className="sanson-float-lines" />

            <div className="sanson-floating-wave sanson-floating-wave-1" />
            <div className="sanson-floating-wave sanson-floating-wave-2" />
            <div className="sanson-floating-wave sanson-floating-wave-3" />

            <div className="sanson-light-sweep" />
            <div className="sanson-light-sweep sanson-light-sweep-2" />
            <div className="sanson-wave" />
          </>
        )}
      </div>

      <div className="sanson-ambient-top" />
    </div>
  );
}
