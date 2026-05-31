"use client";

import { useEffect, useState } from "react";
import { APP_BUILD_ID } from "@/lib/app-build";

const STORAGE_KEY = "sanson-app-build";

export function BuildVersionGuard() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    try {
      const prev = localStorage.getItem(STORAGE_KEY);
      if (prev && prev !== APP_BUILD_ID) {
        setStale(true);
        localStorage.setItem(STORAGE_KEY, APP_BUILD_ID);
        window.location.reload();
        return;
      }
      localStorage.setItem(STORAGE_KEY, APP_BUILD_ID);
    } catch {
      /* ignore private mode */
    }
  }, []);

  if (!stale) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-pink-950/90 p-6 backdrop-blur-md">
      <p className="text-center text-white">Updating SANSON Legal OS to the latest version…</p>
    </div>
  );
}

export function BuildVersionStamp() {
  return (
    <div
      className="pointer-events-none fixed bottom-3 left-3 z-[5] rounded-full border border-white/25 bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-sm"
      aria-hidden
    >
      {APP_BUILD_ID}
    </div>
  );
}
