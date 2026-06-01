import { getApiBaseUrl } from "@/lib/api-url";

const HOSTING_HOSTS = new Set([
  "sansonlawfirm.web.app",
  "sansonlawfirm.firebaseapp.com",
]);

export function isProductionHosting(): boolean {
  if (typeof window === "undefined") return false;
  return HOSTING_HOSTS.has(window.location.hostname);
}

/** Render free tier cold starts can exceed 25s; allow more time on live Hosting. */
export function getRequestTimeoutMs(): number {
  return isProductionHosting() ? 90_000 : 25_000;
}

const RETRYABLE = new Set([
  "Failed to fetch",
  "NetworkError",
  "Load failed",
  "Network request failed",
]);

function isRetryableNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "AbortError") return false;
  const msg = err.message;
  return RETRYABLE.has(msg) || msg.includes("fetch");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retries for transient network failures (common when Render wakes from sleep).
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options?: { timeoutMs?: number; retries?: number }
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? getRequestTimeoutMs();
  const retries = options?.retries ?? (isProductionHosting() ? 2 : 0);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          isProductionHosting()
            ? "The server is taking longer than usual to respond (it may be waking up). Please wait a moment and tap Retry."
            : "The request took too long. Please try again."
        );
      }
      if (attempt < retries && isRetryableNetworkError(err)) {
        await delay(1000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/** Wake Render before authenticated dashboard calls (no auth required). */
export async function pingApiHealth(): Promise<boolean> {
  try {
    const base = getApiBaseUrl();
    const res = await fetchWithRetry(`${base}/api/v1/health`, { method: "GET" }, {
      timeoutMs: 45_000,
      retries: 1,
    });
    return res.ok;
  } catch {
    return false;
  }
}
