/** Direct Render URL — only when cross-origin hosting has no API proxy. */
export const RENDER_API_URL = "https://sanson-lawfirm.onrender.com";

const FIREBASE_HOSTS = new Set([
  "sansonlawfirm.web.app",
  "sansonlawfirm.firebaseapp.com",
]);

function isNetlifyHost(host: string): boolean {
  return host.endsWith(".netlify.app") || host.endsWith(".netlify.live");
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "sanson-lawfirm.onrender.com" || isNetlifyHost(host)) {
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
  const host = window.location.hostname;
  return FIREBASE_HOSTS.has(host) || host.endsWith(".netlify.app");
}

export function isSameOriginApi(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "sanson-lawfirm.onrender.com" || isNetlifyHost(host);
}

export function isLikelyMisconfiguredApi(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (!FIREBASE_HOSTS.has(host) && !host.endsWith(".netlify.app")) return false;
  const env = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
  return env.includes("onrender.com") || env.includes("localhost");
}
