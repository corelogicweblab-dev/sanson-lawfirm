import type { LawyerDashboardPayload } from "@sanson/types";

const LAWYER_KEY = "sanson:lawyer-dashboard:v1";

export function readLawyerDashboardCache(): LawyerDashboardPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAWYER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LawyerDashboardPayload;
  } catch {
    return null;
  }
}

export function writeLawyerDashboardCache(payload: LawyerDashboardPayload): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LAWYER_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export async function prefetchLawyerDashboard(): Promise<void> {
  const { api } = await import("@/lib/api");
  const res = await api.getLawyerDashboard();
  if (res.success && res.data) writeLawyerDashboardCache(res.data);
}
