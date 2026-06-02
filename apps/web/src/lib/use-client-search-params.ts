"use client";

import { useEffect, useState } from "react";

/** Read ?query= on static export (avoids Suspense hanging on Netlify). */
export function useClientSearchParams() {
  const [params, setParams] = useState<URLSearchParams>(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  });

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);

  return params;
}
