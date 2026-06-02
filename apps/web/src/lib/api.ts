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
  LawyerDashboardPayload,
  SearchHistoryItem,
  SearchResultItem,
  SessionInsights,
  TaskItem,
  TimelineEvent,
  ProfileUpdatePayload,
  User,
  UserProfile,
  WorkflowStats,
} from "@sanson/types";
import { API_BASE_PATH } from "@sanson/shared";
import { extractApiErrorMessage } from "@/lib/api-error";
import { fetchWithRetry, isProductionHosting } from "@/lib/api-request";
import { getApiBaseUrl } from "@/lib/api-url";

export class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit & { timeoutMs?: number; retries?: number } = {}
  ): Promise<ApiResponse<T>> {
    const { timeoutMs, retries, ...fetchOptions } = options;
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
      response = await fetchWithRetry(
        `${baseUrl}${API_BASE_PATH}${path}`,
        { ...fetchOptions, headers },
        { timeoutMs, retries }
      );
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(
        isProductionHosting()
          ? "Cannot reach the API server. It may be starting up on Render — wait 30 seconds and tap Retry."
          : "Cannot reach the server. Check your connection and try again."
      );
    }

    const rawText = await response.text();
    let body: ApiResponse<T>;
    try {
      body = (rawText ? JSON.parse(rawText) : {}) as ApiResponse<T>;
    } catch {
      const snippet = rawText.slice(0, 120).replace(/\s+/g, " ");
      throw new Error(
        response.ok
          ? "Invalid response from server."
          : `Server error (${response.status}). ${snippet || "Tap Retry in a moment."}`
      );
    }
    if (!response.ok && body.success !== false) {
      return {
        success: false,
        message: extractApiErrorMessage(
          body as unknown as Record<string, unknown>,
          `Request failed (${response.status})`
        ),
        data: null,
        errors: body.errors,
      } as ApiResponse<T>;
    }
    return body;
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
    data: ProfileUpdatePayload
  ): Promise<ApiResponse<{ profile: UserProfile; user: User | null }>> {
    return this.request(`/users/${userId}/profile`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async updateUserEmail(
    userId: string,
    email: string
  ): Promise<ApiResponse<User>> {
    return this.request(`/users/${userId}/email`, {
      method: "PATCH",
      body: JSON.stringify({ email }),
    });
  }

  async uploadProfileAvatar(
    userId: string,
    file: File
  ): Promise<ApiResponse<{ profile: UserProfile; user: User | null }>> {
    const form = new FormData();
    form.append("file", file);
    const headers: Record<string, string> = {};
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}${API_BASE_PATH}/users/${userId}/profile/avatar`, {
      method: "POST",
      headers,
      body: form,
    });
    return (await response.json()) as ApiResponse<{ profile: UserProfile; user: User | null }>;
  }

  async getProfileAvatarUrl(userId: string): Promise<ApiResponse<{ url: string | null }>> {
    return this.request(`/users/${userId}/profile/avatar-url`);
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

  async getCase(caseId: string): Promise<ApiResponse<CaseItem>> {
    return this.request(`/cases/${caseId}`);
  }

  async listCaseAssignments(caseId: string): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.request(`/assignments/cases/${caseId}`);
  }

  async listCases(pageSize = 100): Promise<ApiResponse<CaseItem[]>> {
    const size = Math.min(100, Math.max(1, pageSize));
    return this.request(`/cases/?page_size=${size}`);
  }

  async getLawyerDashboard(): Promise<ApiResponse<LawyerDashboardPayload>> {
    return this.request("/workflow/lawyer-dashboard", { retries: 0, timeoutMs: 25_000 });
  }

  async getLawyerReviewQueue(limit = 200): Promise<ApiResponse<CaseItem[]>> {
    return this.request(`/workflow/lawyer-review-queue?limit=${limit}`);
  }

  async listUserDirectory(role?: string): Promise<ApiResponse<Record<string, unknown>[]>> {
    const q = role ? `?role=${encodeURIComponent(role)}&page_size=100` : "?page_size=100";
    return this.request(`/users/directory${q}`);
  }

  async createCase(payload: Record<string, unknown>): Promise<ApiResponse<CaseItem>> {
    return this.request("/cases/", { method: "POST", body: JSON.stringify(payload) });
  }

  async createMasterCase(payload: Record<string, unknown>): Promise<ApiResponse<CaseItem & { master_data?: Record<string, unknown> }>> {
    return this.request("/cases/master-intake", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createCaseFromRequest(
    requestId: string,
    payload: Record<string, unknown>
  ): Promise<ApiResponse<CaseItem>> {
    return this.request(`/cases/from-request/${requestId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateCase(caseId: string, payload: Record<string, unknown>): Promise<ApiResponse<CaseItem>> {
    return this.request(`/cases/${caseId}`, { method: "PATCH", body: JSON.stringify(payload) });
  }

  async assignCase(
    caseId: string,
    payload: { assignee_id: string; assignee_role: string; notes?: string }
  ): Promise<ApiResponse<unknown>> {
    return this.request(`/assignments/cases/${caseId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createTimelineEvent(
    caseId: string,
    payload: Record<string, unknown>
  ): Promise<ApiResponse<unknown>> {
    return this.request(`/timelines/cases/${caseId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async createAppointment(payload: Record<string, unknown>): Promise<ApiResponse<Appointment>> {
    return this.request("/appointments/", { method: "POST", body: JSON.stringify(payload) });
  }

  async createIntakeRequest(
    payload: Record<string, unknown>
  ): Promise<ApiResponse<LegalRequest>> {
    return this.request("/legal-requests/", { method: "POST", body: JSON.stringify(payload) });
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
    let hadError = false;

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
          if (payload.error) {
            hadError = true;
            onError(payload.error);
          } else if (payload.delta) onDelta(payload.delta);
          else if (payload.done) {
            /* stream complete */
          }
        } catch {
          /* skip malformed chunks */
        }
      }
    }
    if (hadError) {
      onError("Stream ended before completion");
    } else {
      onDone();
    }
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

  async listDocuments(caseId?: string, pageSize = 200): Promise<ApiResponse<DocumentItem[]>> {
    const params = new URLSearchParams({ page_size: String(pageSize) });
    if (caseId) params.set("case_id", caseId);
    return this.request(`/documents/?${params}`);
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

    const controller = new AbortController();
    const timeoutMs = Math.max(120_000, Math.min(900_000, file.size / 1024 + 120_000));
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${getApiBaseUrl()}${API_BASE_PATH}/documents/upload`, {
        method: "POST",
        headers,
        body: form,
        signal: controller.signal,
      });
      let body: ApiResponse<DocumentItem> & Record<string, unknown>;
      try {
        body = (await response.json()) as ApiResponse<DocumentItem> & Record<string, unknown>;
      } catch {
        return {
          success: false,
          message: response.ok
            ? "Upload response was invalid."
            : `Upload failed (${response.status}). Try again or use a smaller file.`,
          data: null,
          meta: null,
          errors: null,
        };
      }
      if (!response.ok && body.success !== false) {
        return {
          success: false,
          message: extractApiErrorMessage(body, `Upload failed (${response.status})`),
          data: null,
          meta: body.meta ?? null,
          errors: body.errors ?? null,
        };
      }
      return body;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          success: false,
          message: "Upload timed out. Try a smaller file or check your connection.",
          data: null,
          meta: null,
          errors: null,
        };
      }
      return {
        success: false,
        message: "Upload failed. Check your connection and try again.",
        data: null,
        meta: null,
        errors: null,
      };
    } finally {
      clearTimeout(timer);
    }
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

  async listEvidence(caseId?: string, pageSize = 200): Promise<ApiResponse<EvidenceItemRecord[]>> {
    const params = new URLSearchParams({ page_size: String(pageSize) });
    if (caseId) params.set("case_id", caseId);
    return this.request(`/evidence/?${params}`);
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

  async getMigrationSummary(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request("/case-migration/summary");
  }

  async getMigrationQueue(status?: string): Promise<ApiResponse<Record<string, unknown>[]>> {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(`/case-migration/queue${q}`);
  }

  async createLegacyCase(body: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request("/case-migration/legacy-case", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async bulkImportCases(cases: Record<string, unknown>[]): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request("/case-migration/bulk-cases", {
      method: "POST",
      body: JSON.stringify({ cases }),
    });
  }

  async bulkImportDocuments(
    documents: Record<string, unknown>[]
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request("/case-migration/bulk-documents", {
      method: "POST",
      body: JSON.stringify({ documents }),
    });
  }

  async assignMigrationStaff(
    itemId: string,
    body: { lawyer_id?: string; paralegal_id?: string }
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request(`/case-migration/${itemId}/assign`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async validateMigrationRecord(
    itemId: string,
    body: { notes?: string; import_now?: boolean }
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request(`/case-migration/${itemId}/validate`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

export const api = new ApiClient();

