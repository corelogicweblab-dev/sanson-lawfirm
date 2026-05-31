import type {
  ApiResponse,
  Appointment,
  AuthSyncRequest,
  CaseItem,
  ChatMessage,
  ChatSession,
  LegalRequest,
  SessionInsights,
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

  async createChatSession(): Promise<ApiResponse<ChatSession>> {
    return this.request("/chat/session", { method: "POST" });
  }

  async listChatSessions(page = 1): Promise<ApiResponse<ChatSession[]>> {
    return this.request(`/chat/session?page=${page}`);
  }

  async getChatHistory(sessionId: string): Promise<ApiResponse<ChatMessage[]>> {
    return this.request(`/chat/history?session_id=${sessionId}`);
  }

  async getSessionInsights(sessionId: string): Promise<ApiResponse<SessionInsights>> {
    return this.request(`/chat/session/${sessionId}/insights`);
  }

  async sendChatMessage(
    sessionId: string,
    message: string
  ): Promise<ApiResponse<{ userMessage: ChatMessage; aiMessage: ChatMessage }>> {
    return this.request(`/chat/session/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  async streamChatMessage(
    sessionId: string,
    message: string,
    onDelta: (text: string) => void,
    onDone: () => void,
    onError: (err: string) => void
  ): Promise<void> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${API_URL}${API_BASE_PATH}/chat/session/${sessionId}/messages?stream=true`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok || !response.body) {
      onError("Failed to send message");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const payload = JSON.parse(line.slice(6));
          if (payload.error) onError(payload.error);
          else if (payload.delta) onDelta(payload.delta);
          else if (payload.done) onDone();
        } catch {
          /* skip malformed chunks */
        }
      }
    }
    onDone();
  }

  async submitChatDecision(
    sessionId: string,
    decision: string
  ): Promise<
    ApiResponse<{
      decision: string;
      legalRequestId: string | null;
      requestReference?: string;
    }>
  > {
    return this.request(`/chat/session/${sessionId}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
  }

  async getSuggestedQuestions(): Promise<ApiResponse<string[]>> {
    return this.request("/chat/suggested-questions");
  }

  async generateAiSummary(sessionId: string): Promise<ApiResponse<unknown>> {
    return this.request("/ai/summary", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    });
  }
}

export const api = new ApiClient();

