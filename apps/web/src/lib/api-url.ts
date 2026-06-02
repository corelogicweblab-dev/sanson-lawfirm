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

/** Direct Render URL for large uploads or when same-origin proxy fails. */
export function getUploadApiBaseUrl(): string {
  if (typeof window !== "undefined" && isSameOriginApi()) {
    return RENDER_API_URL;
  }
  return getApiBaseUrl();
}

/**
 * Upload targets for multipart POST.
 * Netlify: same-origin /api proxy only for typical files (browser CORS to Render often fails).
 * Large files (>100MB): also try Render direct after proxy.
 */
export function buildDocumentUploadBases(fileSize: number): string[] {
  const direct = getUploadApiBaseUrl().replace(/\/$/, "");
  const proxied = getApiBaseUrl().replace(/\/$/, "");
  const onNetlifyProxy =
    typeof window !== "undefined" && isSameOriginApi() && proxied === "";
  const hugeFile = fileSize > 100 * 1024 * 1024;

  if (onNetlifyProxy) {
    return hugeFile && direct ? ["", direct] : [""];
  }

  const bases: string[] = [];
  if (direct) bases.push(direct);
  if (proxied && proxied !== direct) bases.push(proxied);
  return bases.length ? bases : [""];
}

export function isLikelyMisconfiguredApi(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (!FIREBASE_HOSTS.has(host) && !host.endsWith(".netlify.app")) return false;
  const env = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
  return env.includes("onrender.com") || env.includes("localhost");
}
