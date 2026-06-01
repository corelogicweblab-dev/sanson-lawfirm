/** Direct Render URL — local dev, mobile, server-side. */
export const RENDER_API_URL = "https://sanson-lawfirm.onrender.com";

const HOSTING_HOSTS = new Set([
  "sansonlawfirm.web.app",
  "sansonlawfirm.firebaseapp.com",
]);

/**
 * On Firebase Hosting use same-origin `/api/*` (proxied to Render).
 * Avoids browser NetworkError from cross-site blocking of onrender.com.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && HOSTING_HOSTS.has(window.location.hostname)) {
    return "";
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv && !fromEnv.includes("localhost") && !fromEnv.includes("127.0.0.1")) {
    return fromEnv.replace(/\/$/, "");
  }

  return fromEnv || "http://localhost:8100";
}

export function isProductionHosting(): boolean {
  if (typeof window === "undefined") return false;
  return HOSTING_HOSTS.has(window.location.hostname);
}

export function isLikelyMisconfiguredApi(): boolean {
  if (typeof window === "undefined") return false;
  if (!isProductionHosting()) return false;
  const env = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
  return env.includes("localhost") || env.includes("127.0.0.1");
}
