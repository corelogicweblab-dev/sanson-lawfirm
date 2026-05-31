/** Production API — used when build omitted NEXT_PUBLIC_API_URL on Firebase Hosting. */
const PRODUCTION_API_URL = "https://sanson-lawfirm.onrender.com";

const HOSTING_HOSTS = new Set([
  "sansonlawfirm.web.app",
  "sansonlawfirm.firebaseapp.com",
]);

/**
 * Resolve API base URL. NEXT_PUBLIC_* is baked in at build time; if missing on
 * Hosting, fall back to Render so login sync does not hit localhost.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv && !fromEnv.includes("localhost") && !fromEnv.includes("127.0.0.1")) {
    return fromEnv.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && HOSTING_HOSTS.has(window.location.hostname)) {
    return PRODUCTION_API_URL;
  }

  return fromEnv || "http://localhost:8100";
}

export function isLikelyMisconfiguredApi(): boolean {
  if (typeof window === "undefined") return false;
  if (!HOSTING_HOSTS.has(window.location.hostname)) return false;
  const env = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
  return !env || env.includes("localhost") || env.includes("127.0.0.1");
}
