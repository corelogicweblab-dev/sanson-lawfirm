"use client";

import { useMotion } from "@/components/providers/motion-provider";

export function FuturisticBackground() {
  const { tier } = useMotion();
  const showBlobs = tier === "full";

  return (
    <div className="sanson-app-bg" aria-hidden>
      {showBlobs && (
        <>
          <div className="sanson-blob sanson-blob-1" />
          <div className="sanson-blob sanson-blob-2" />
          <div className="sanson-blob sanson-blob-3" />
        </>
      )}
      <div className="sanson-wave" />
    </div>
  );
}
