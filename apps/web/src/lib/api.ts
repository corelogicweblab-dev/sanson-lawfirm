import type {
  ApiResponse,
  Appointment,
  AuthSyncRequest,
  CaseItem,
  ChatMessage,
  ChatSession,
  DocumentAnalysisResult,
  DocumentCategory,
  DocumentItem,
  EvidenceItemRecord,
  EvidenceTimelineEvent,
  KnowledgeArticleItem,
  KnowledgeCategoryItem,
  LegalRequest,
  SearchHistoryItem,
  SearchResultItem,
  SessionInsights,
  TaskItem,
  TimelineEvent,
  User,
  WorkflowStats,
} from "@sanson/types";
import { API_BASE_PATH } from "@sanson/shared";
import { getApiBaseUrl } from "@/lib/api-url";

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

    const baseUrl = getApiBaseUrl();
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${API_BASE_PATH}${path}`, {
        ...options,
        headers,
      });
    } catch {
      throw new Error(
        `Cannot reach API at ${baseUrl}. Check that Render is running and CORS_ORIGINS includes ${typeof window !== "undefined" ? window.location.origin : "your site"}.`
      );
    }

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
      `${getApiBaseUrl()}${API_BASE_PATH}/chat/session/${sessionId}/messages?stream=true`,
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

  async listDocumentCategories(): Promise<ApiResponse<DocumentCategory[]>> {
    return this.request("/documents/categories");
  }

  async listDocuments(caseId?: string): Promise<ApiResponse<DocumentItem[]>> {
    const path = caseId ? `/documents/?case_id=${caseId}` : "/documents/";
    return this.request(path);
  }

  async uploadDocument(
    file: File,
    meta?: { categoryId?: string; caseId?: string; legalRequestId?: string }
  ): Promise<ApiResponse<DocumentItem>> {
    const form = new FormData();
    form.append("file", file);
    if (meta?.categoryId) form.append("category_id", meta.categoryId);
    if (meta?.caseId) form.append("case_id", meta.caseId);
    if (meta?.legalRequestId) form.append("legal_request_id", meta.legalRequestId);

    const headers: Record<string, string> = {};
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await fetch(`${getApiBaseUrl()}${API_BASE_PATH}/documents/upload`, {
      method: "POST",
      headers,
      body: form,
    });
    return response.json();
  }

  async getDocument(id: string): Promise<ApiResponse<DocumentItem>> {
    return this.request(`/documents/${id}`);
  }

  async processDocument(id: string): Promise<ApiResponse<unknown>> {
    return this.request(`/documents/${id}/process`, { method: "POST" });
  }

  async getDocumentAnalyses(id: string): Promise<ApiResponse<DocumentAnalysisResult[]>> {
    return this.request(`/document-analysis/${id}`);
  }

  async listEvidence(caseId?: string): Promise<ApiResponse<EvidenceItemRecord[]>> {
    const path = caseId ? `/evidence/?case_id=${caseId}` : "/evidence/";
    return this.request(path);
  }

  async listEvidenceTimelines(params?: {
    caseId?: string;
    documentId?: string;
  }): Promise<ApiResponse<EvidenceTimelineEvent[]>> {
    const q = new URLSearchParams();
    if (params?.caseId) q.set("case_id", params.caseId);
    if (params?.documentId) q.set("document_id", params.documentId);
    const qs = q.toString();
    return this.request(qs ? `/evidence-timelines/?${qs}` : "/evidence-timelines/");
  }

  async search(
    query: string,
    mode = "HYBRID",
    limit = 20,
    filters?: Record<string, unknown>
  ): Promise<ApiResponse<SearchResultItem[]>> {
    return this.request("/search/", {
      method: "POST",
      body: JSON.stringify({ query, mode, limit, filters }),
    });
  }

  async getSearchHistory(): Promise<ApiResponse<SearchHistoryItem[]>> {
    return this.request("/search/history");
  }

  async getSearchAnalytics(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request("/search/analytics");
  }

  async getRecommendations(): Promise<
    ApiResponse<{
      recommendations: Array<Record<string, unknown>>;
      recentSearches: Array<{ query: string; mode: string; at: string }>;
    }>
  > {
    return this.request("/recommendations/");
  }

  async listKnowledgeArticles(): Promise<ApiResponse<KnowledgeArticleItem[]>> {
    return this.request("/knowledge/");
  }

  async getKnowledgeArticle(slug: string): Promise<ApiResponse<KnowledgeArticleItem>> {
    return this.request(`/knowledge/${slug}`);
  }

  async listKnowledgeCategories(): Promise<ApiResponse<KnowledgeCategoryItem[]>> {
    return this.request("/knowledge/categories");
  }

  async getSystemHealth(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request("/system/health");
  }

  async listSystemSettings(): Promise<
    ApiResponse<Array<{ key: string; value: Record<string, unknown>; description: string | null }>>
  > {
    return this.request("/system/settings");
  }

  async updateSystemSetting(
    key: string,
    value: Record<string, unknown>
  ): Promise<ApiResponse<{ key: string; value: Record<string, unknown> }>> {
    return this.request(`/system/settings/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ value }),
    });
  }

  async listAuditLogs(page = 1, pageSize = 25): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request(`/audit/?page=${page}&page_size=${pageSize}`);
  }

  async listAiAuditLogs(page = 1, pageSize = 25): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request(`/audit/ai?page=${page}&page_size=${pageSize}`);
  }

  async listSecurityEvents(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request("/security/events");
  }

  async setEmergencyLockout(
    enabled: boolean,
    reason?: string
  ): Promise<ApiResponse<{ enabled: boolean }>> {
    return this.request("/security/lockout", {
      method: "POST",
      body: JSON.stringify({ enabled, reason }),
    });
  }

  async listMySessions(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request("/sessions/");
  }

  async listAllSessions(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request("/sessions/all");
  }

  async revokeSession(sessionId: string): Promise<ApiResponse<{ revoked: boolean }>> {
    return this.request(`/sessions/${sessionId}`, { method: "DELETE" });
  }

  async revokeAllSessions(): Promise<ApiResponse<{ count: number }>> {
    return this.request("/sessions/revoke-all", { method: "POST" });
  }

  async listBackups(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request("/system/backups");
  }

  async getOpsDashboard(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request("/ops/dashboard");
  }

  async getOpsEnvironment(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request("/ops/environment");
  }

  async listDeployments(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request("/ops/deployments");
  }

  async listOpsAlerts(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request("/ops/alerts");
  }

  async resolveOpsAlert(alertId: string): Promise<ApiResponse<{ resolved: boolean }>> {
    return this.request(`/ops/alerts/${alertId}/resolve`, { method: "POST" });
  }

  async getMigrationStatus(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request("/ops/migrations");
  }
}

export const api = new ApiClient();

