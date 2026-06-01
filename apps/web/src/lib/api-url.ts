/** Direct Render URL — fallback for cross-origin Hosting. */
export const RENDER_API_URL = "https://sanson-lawfirm.onrender.com";

const FIREBASE_HOSTS = new Set([
  "sansonlawfirm.web.app",
  "sansonlawfirm.firebaseapp.com",
]);

/** Combined UI+API on one host — no cross-origin, no NetworkError. */
const SAME_ORIGIN_HOSTS = new Set([
  ...FIREBASE_HOSTS,
  "sanson-lawfirm.onrender.com",
  "localhost",
  "127.0.0.1",
]);

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "sanson-lawfirm.onrender.com" || host === "localhost" || host === "127.0.0.1") {
      return host === "localhost" || host === "127.0.0.1" ? "http://localhost:8100" : "";
    }
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv && !fromEnv.includes("localhost") && !fromEnv.includes("127.0.0.1")) {
    return fromEnv.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && FIREBASE_HOSTS.has(window.location.hostname)) {
    return RENDER_API_URL;
  }

  return fromEnv || "http://localhost:8100";
}

export function isProductionHosting(): boolean {
  if (typeof window === "undefined") return false;
  return FIREBASE_HOSTS.has(window.location.hostname);
}

export function isSameOriginApi(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host === "sanson-lawfirm.onrender.com") return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
}

export function isLikelyMisconfiguredApi(): boolean {
  if (typeof window === "undefined") return false;
  if (!FIREBASE_HOSTS.has(window.location.hostname)) return false;
  const env = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
  return env.includes("localhost") || env.includes("127.0.0.1");
}
