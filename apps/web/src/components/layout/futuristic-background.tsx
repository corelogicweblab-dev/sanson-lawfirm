"use client";

import { useMotion } from "@/components/providers/motion-provider";

export function FuturisticBackground() {
  const { tier } = useMotion();
  const showBlobs = tier !== "minimal";

  return (
    <div className="sanson-app-bg" aria-hidden>
      <div className="sanson-mesh-grid" />
      {showBlobs && (
        <>
          <div className="sanson-blob sanson-blob-1" />
          <div className="sanson-blob sanson-blob-2" />
          <div className="sanson-blob sanson-blob-3" />
          <div className="sanson-blob sanson-blob-4" />
        </>
      )}
      <div className="sanson-wave" />
      <div className="sanson-ambient-top" />
    </div>
  );
}
