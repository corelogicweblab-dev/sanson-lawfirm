import { API_BASE_PATH } from "@sanson/shared";
import type { ApiResponse, MobileDashboard, MobileNotification, User } from "@sanson/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8100";

let token: string | null = null;

export function setApiToken(t: string | null) {
  token = t;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${API_BASE_PATH}${path}`, { ...options, headers });
  return res.json();
}

export const api = {
  syncUser: (body: { role?: string; first_name?: string; last_name?: string }) =>
    request<{ user: User; is_new_user: boolean }>("/auth/sync", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  mobileBootstrap: () =>
    request<{
      user: { id: string; email: string; role: string };
      dashboard: MobileDashboard;
      realtime: Record<string, unknown>;
    }>("/mobile/bootstrap"),

  registerDevice: (body: {
    device_name: string;
    device_uuid: string;
    platform: string;
    fcm_token?: string;
  }) => request("/devices/register", { method: "POST", body: JSON.stringify(body) }),

  listNotifications: (unreadOnly = false) =>
    request<MobileNotification[]>(`/notifications/?unread_only=${unreadOnly}`),

  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: "POST" }),

  listCases: () => request<unknown[]>("/cases/"),

  listDocuments: () => request<unknown[]>("/documents/"),

  listAppointments: () => request<unknown[]>("/appointments/"),

  listTasks: () => request<unknown[]>("/tasks/"),

  listChatSessions: () => request<unknown[]>("/chat/sessions"),

  search: (query: string, mode = "HYBRID") =>
    request("/search/", {
      method: "POST",
      body: JSON.stringify({ query, mode, limit: 15 }),
    }),

  pollSync: (since?: string) =>
    request(`/sync/events?limit=30${since ? `&since=${encodeURIComponent(since)}` : ""}`),

  getRealtimeConfig: () => request("/sync/realtime-config"),
};
