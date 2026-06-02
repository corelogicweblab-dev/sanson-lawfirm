/**
 * Full-page navigation for static export (Netlify).
 * Next.js client router can load /route/index.txt (RSC payload) instead of HTML —
 * use these helpers for auth redirects and logout.
 */

export const LOGIN_PATH = "/login/";

function normalizeAppPath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

export function hardNavigate(path: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(normalizeAppPath(path));
}

export function hardReplace(path: string): void {
  if (typeof window === "undefined") return;
  window.location.replace(normalizeAppPath(path));
}

export function navigateToLogin(): void {
  hardReplace(LOGIN_PATH);
}
