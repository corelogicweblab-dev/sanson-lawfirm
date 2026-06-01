"use client";

/**
 * Stable holographic background — transform-only motion (no opacity pulsing / scan flashes).
 */
export function FuturisticBackground() {
  return (
    <div className="sanson-app-bg" aria-hidden>
      <div className="sanson-bg-gradient-shift" />
      <div className="sanson-cyber-streak sanson-cyber-streak-a" />
      <div className="sanson-cyber-streak sanson-cyber-streak-b" />
      <div className="sanson-hex-mesh" />
      <div className="sanson-holo-floor" />
      <div className="sanson-grid-scan" />
      <div className="sanson-light-sweep" />
      <div className="sanson-depth-veil" />
    </div>
  );
}
