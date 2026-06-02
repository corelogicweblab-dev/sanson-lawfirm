"use client";

import { useEffect, useRef } from "react";

/** Refetch dashboard data on an interval and when the user returns to the tab. */
export function useAutoRefresh(onRefresh: () => void, intervalMs = 45_000) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const tick = () => onRefreshRef.current();
    const timer = window.setInterval(tick, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
}
