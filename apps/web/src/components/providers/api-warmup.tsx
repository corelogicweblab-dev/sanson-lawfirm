"use client";

import { useEffect } from "react";
import { pingApiHealth } from "@/lib/api-request";

/** Warm Render API as soon as the app shell loads (before dashboard routes). */
export function ApiWarmup() {
  useEffect(() => {
    void pingApiHealth();
  }, []);
  return null;
}
