import type {
  ApiResponse,
  Appointment,
  AuthSyncRequest,
  CaseItem,
  LegalRequest,
  TaskItem,
  TimelineEvent,
  User,
  WorkflowStats,
} from "@sanson/types";
import { API_BASE_PATH } from "@sanson/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8100";

export class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${API_BASE_PATH}${path}`, {
      ...options,
      headers,
    });

    return response.json();
  }

  async syncUser(data: AuthSyncRequest): Promise<ApiResponse<{ user: User; is_new_user: boolean }>> {
    return this.request("/auth/sync", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request("/auth/me");
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.request("/auth/logout", { method: "POST" });
  }

  async getDashboardStats(): Promise<ApiResponse<{
    total_users: number;
    clients: number;
    lawyers: number;
    paralegals: number;
    admins: number;
  }>> {
    return this.request("/users/stats");
  }

  async getWorkflowStats(): Promise<ApiResponse<WorkflowStats>> {
    return this.request("/workflow/stats");
  }

  async listUsers(page = 1, role?: string): Promise<ApiResponse<User[]>> {
    const params = new URLSearchParams({ page: String(page) });
    if (role) params.set("role", role);
    return this.request(`/users/?${params}`);
  }

  async getRecentAudit(): Promise<ApiResponse<unknown[]>> {
    return this.request("/audit/recent");
  }

  async updateProfile(
    userId: string,
    data: Record<string, string | undefined>
  ): Promise<ApiResponse<unknown>> {
    return this.request(`/users/${userId}/profile`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async listMyRequests(): Promise<ApiResponse<LegalRequest[]>> {
    return this.request("/legal-requests/");
  }

  async createRequest(payload: {
    case_category: string;
    subject: string;
    description: string;
    priority: string;
  }): Promise<ApiResponse<LegalRequest>> {
    return this.request("/legal-requests/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async listAppointments(): Promise<ApiResponse<Appointment[]>> {
    return this.request("/appointments/");
  }

  async listCases(): Promise<ApiResponse<CaseItem[]>> {
    return this.request("/cases/");
  }

  async listTasks(): Promise<ApiResponse<TaskItem[]>> {
    return this.request("/tasks/");
  }

  async listTimeline(caseId: string): Promise<ApiResponse<TimelineEvent[]>> {
    return this.request(`/timelines/cases/${caseId}`);
  }

  async listComments(caseId: string): Promise<ApiResponse<unknown[]>> {
    return this.request(`/comments/cases/${caseId}`);
  }
}

export const api = new ApiClient();

