import type { UserRole } from "@sanson/types";

export const APP_NAME = "SANSON Legal OS";
export const POWERED_BY = "CoreLogic";

export const ROLES: Record<UserRole, UserRole> = {
  CLIENT: "CLIENT",
  LAWYER: "LAWYER",
  PARALEGAL: "PARALEGAL",
  ADMIN: "ADMIN",
};

export const ROLE_DISPLAY: Record<UserRole, string> = {
  CLIENT: "Client",
  LAWYER: "Lawyer",
  PARALEGAL: "Paralegal",
  ADMIN: "Administrator",
};

export const ROLE_DASHBOARD_PATH: Record<UserRole, string> = {
  CLIENT: "/dashboard/client",
  LAWYER: "/dashboard/lawyer",
  PARALEGAL: "/dashboard/paralegal",
  ADMIN: "/dashboard/admin",
};

/** Known firm test/production emails → dashboard role (also applied on backend sync). */
export const EMAIL_ROLE_MAP: Record<string, UserRole> = {
  "admin@sansonlaw.ph": "ADMIN",
  "lawyer@sansonlaw.ph": "LAWYER",
  "paralegal@sansonlaw.ph": "PARALEGAL",
  "client@sansonlaw.ph": "CLIENT",
};

export function inferRoleFromEmail(email: string): UserRole {
  return EMAIL_ROLE_MAP[email.trim().toLowerCase()] ?? "CLIENT";
}

export const PERMISSIONS = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  USERS_DELETE: "users:delete",
  ROLES_READ: "roles:read",
  ROLES_WRITE: "roles:write",
  PERMISSIONS_READ: "permissions:read",
  PERMISSIONS_WRITE: "permissions:write",
  AUDIT_READ: "audit:read",
  PROFILE_READ: "profile:read",
  PROFILE_WRITE: "profile:write",
  DASHBOARD_CLIENT: "dashboard:client",
  DASHBOARD_LAWYER: "dashboard:lawyer",
  DASHBOARD_PARALEGAL: "dashboard:paralegal",
  DASHBOARD_ADMIN: "dashboard:admin",

  LEGAL_REQUESTS_READ: "legal_requests:read",
  LEGAL_REQUESTS_WRITE: "legal_requests:write",
  LEGAL_REQUESTS_CREATE: "legal_requests:create",

  APPOINTMENTS_READ: "appointments:read",
  APPOINTMENTS_WRITE: "appointments:write",
  APPOINTMENTS_SCHEDULE: "appointments:schedule",

  CASES_READ: "cases:read",
  CASES_WRITE: "cases:write",
  CASES_ASSIGN: "cases:assign",
  CASES_APPROVE: "cases:approve",
  CASES_CLOSE: "cases:close",
  MIGRATION_READ: "migration:read",
  MIGRATION_WRITE: "migration:write",

  TASKS_READ: "tasks:read",
  TASKS_WRITE: "tasks:write",

  COMMENTS_READ: "comments:read",
  COMMENTS_WRITE: "comments:write",

  CONSULTATIONS_READ: "consultations:read",
  CONSULTATIONS_WRITE: "consultations:write",

  TIMELINES_READ: "timelines:read",
  TIMELINES_WRITE: "timelines:write",

  CHAT_READ: "chat:read",
  CHAT_WRITE: "chat:write",
  CHAT_CREATE: "chat:create",
  AI_READ: "ai:read",
  AI_GENERATE: "ai:generate",

  DOCUMENTS_READ: "documents:read",
  DOCUMENTS_WRITE: "documents:write",
  DOCUMENTS_DELETE: "documents:delete",
  DOCUMENTS_REVIEW: "documents:review",
  EVIDENCE_READ: "evidence:read",
  EVIDENCE_WRITE: "evidence:write",
  OCR_RUN: "ocr:run",
  DOCUMENT_ANALYSIS_RUN: "document_analysis:run",
  EVIDENCE_TIMELINES_READ: "evidence_timelines:read",
  EVIDENCE_TIMELINES_WRITE: "evidence_timelines:write",

  SEARCH_READ: "search:read",
  SEARCH_ADMIN: "search:admin",
  KNOWLEDGE_READ: "knowledge:read",
  KNOWLEDGE_WRITE: "knowledge:write",
  EMBEDDINGS_RUN: "embeddings:run",
  RECOMMENDATIONS_READ: "recommendations:read",
  CONTEXT_READ: "context:read",
} as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  CLIENT: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.DASHBOARD_CLIENT,
    PERMISSIONS.LEGAL_REQUESTS_READ,
    PERMISSIONS.LEGAL_REQUESTS_CREATE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.CASES_READ,
    PERMISSIONS.TIMELINES_READ,
    PERMISSIONS.CHAT_READ,
    PERMISSIONS.CHAT_WRITE,
    PERMISSIONS.CHAT_CREATE,
    PERMISSIONS.AI_READ,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
    PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.EVIDENCE_WRITE,
    PERMISSIONS.EVIDENCE_TIMELINES_READ,
    PERMISSIONS.SEARCH_READ,
    PERMISSIONS.KNOWLEDGE_READ,
  ],
  LAWYER: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.DASHBOARD_LAWYER,
    PERMISSIONS.LEGAL_REQUESTS_READ,
    PERMISSIONS.LEGAL_REQUESTS_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_WRITE,
    PERMISSIONS.APPOINTMENTS_SCHEDULE,
    PERMISSIONS.CASES_READ,
    PERMISSIONS.CASES_WRITE,
    PERMISSIONS.CASES_ASSIGN,
    PERMISSIONS.CASES_APPROVE,
    PERMISSIONS.CASES_CLOSE,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.COMMENTS_WRITE,
    PERMISSIONS.CONSULTATIONS_READ,
    PERMISSIONS.CONSULTATIONS_WRITE,
    PERMISSIONS.TIMELINES_READ,
    PERMISSIONS.TIMELINES_WRITE,
    PERMISSIONS.CHAT_READ,
    PERMISSIONS.AI_READ,
    PERMISSIONS.AI_GENERATE,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
    PERMISSIONS.DOCUMENTS_DELETE,
    PERMISSIONS.DOCUMENTS_REVIEW,
    PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.EVIDENCE_WRITE,
    PERMISSIONS.OCR_RUN,
    PERMISSIONS.DOCUMENT_ANALYSIS_RUN,
    PERMISSIONS.EVIDENCE_TIMELINES_READ,
    PERMISSIONS.EVIDENCE_TIMELINES_WRITE,
    PERMISSIONS.SEARCH_READ,
    PERMISSIONS.KNOWLEDGE_READ,
    PERMISSIONS.KNOWLEDGE_WRITE,
    PERMISSIONS.EMBEDDINGS_RUN,
    PERMISSIONS.RECOMMENDATIONS_READ,
    PERMISSIONS.CONTEXT_READ,
  ],
  PARALEGAL: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.DASHBOARD_PARALEGAL,
    PERMISSIONS.LEGAL_REQUESTS_READ,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.CASES_READ,
    PERMISSIONS.CASES_WRITE,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.COMMENTS_WRITE,
    PERMISSIONS.CONSULTATIONS_READ,
    PERMISSIONS.CONSULTATIONS_WRITE,
    PERMISSIONS.TIMELINES_READ,
    PERMISSIONS.TIMELINES_WRITE,
    PERMISSIONS.CHAT_READ,
    PERMISSIONS.AI_READ,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
    PERMISSIONS.DOCUMENTS_REVIEW,
    PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.EVIDENCE_WRITE,
    PERMISSIONS.OCR_RUN,
    PERMISSIONS.DOCUMENT_ANALYSIS_RUN,
    PERMISSIONS.EVIDENCE_TIMELINES_READ,
    PERMISSIONS.EVIDENCE_TIMELINES_WRITE,
    PERMISSIONS.SEARCH_READ,
    PERMISSIONS.KNOWLEDGE_READ,
    PERMISSIONS.EMBEDDINGS_RUN,
    PERMISSIONS.RECOMMENDATIONS_READ,
    PERMISSIONS.CONTEXT_READ,
  ],
  ADMIN: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.DASHBOARD_ADMIN,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.ROLES_READ,
    PERMISSIONS.ROLES_WRITE,
    PERMISSIONS.PERMISSIONS_READ,
    PERMISSIONS.PERMISSIONS_WRITE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.CASES_READ,
    PERMISSIONS.LEGAL_REQUESTS_READ,
    PERMISSIONS.MIGRATION_READ,
  ],
};

/** Case origin in the centralized repository */
export const CASE_SOURCE_TYPES = ["LEGACY", "AI_INTAKE", "MANUAL"] as const;
export type CaseSourceType = (typeof CASE_SOURCE_TYPES)[number];

export const CASE_SOURCE_LABELS: Record<CaseSourceType, string> = {
  LEGACY: "Legacy (migrated)",
  AI_INTAKE: "AI intake",
  MANUAL: "Manual / draft",
};

export const AUDIT_ACTIONS = {
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  USER_REGISTER: "user.register",
  USER_SYNC: "user.sync",
  PROFILE_UPDATE: "profile.update",
  ROLE_CHANGE: "role.change",
  PERMISSION_CHANGE: "permission.change",
  USER_DEACTIVATE: "user.deactivate",
  USER_ACTIVATE: "user.activate",
  SECURITY_EVENT: "security.event",

  LEGAL_REQUEST_CREATE: "legal_request.create",
  LEGAL_REQUEST_STATUS: "legal_request.status_change",
  APPOINTMENT_CREATE: "appointment.create",
  APPOINTMENT_UPDATE: "appointment.update",
  CASE_CREATE: "case.create",
  CASE_UPDATE: "case.update",
  ASSIGNMENT_CHANGE: "case.assignment",
  TASK_CREATE: "task.create",
  TASK_UPDATE: "task.update",
  COMMENT_CREATE: "comment.create",
  CONSULTATION_NOTE: "consultation.note",
  CONSULTATION_OUTCOME: "consultation.outcome",
  TIMELINE_CREATE: "timeline.create",

  CHAT_STARTED: "chat.started",
  CHAT_ENDED: "chat.ended",
  CHAT_PAUSED: "chat.paused",
  AI_SUMMARY: "ai.summary_generated",
  AI_CLASSIFICATION: "ai.classification_generated",
  AI_RECOMMENDATION: "ai.recommendation_generated",
  REPRESENTATION_FROM_CHAT: "chat.representation_requested",

  DOCUMENT_UPLOAD: "document.upload",
  DOCUMENT_DOWNLOAD: "document.download",
  DOCUMENT_DELETE: "document.delete",
  DOCUMENT_VERSION: "document.version_create",
  DOCUMENT_OCR: "document.ocr",
  DOCUMENT_ANALYSIS: "document.analysis",
  EVIDENCE_CREATE: "evidence.create",
  EVIDENCE_TIMELINE: "evidence.timeline_generated",

  SEARCH_PERFORMED: "search.performed",
  KNOWLEDGE_VIEWED: "knowledge.viewed",
  KNOWLEDGE_CREATED: "knowledge.created",
  EMBEDDING_GENERATED: "embedding.document_indexed",
  RECOMMENDATION_GENERATED: "recommendation.generated",
  CONTEXT_GENERATED: "context.case_generated",

  MOBILE_LOGIN: "mobile.login",
  MOBILE_DEVICE_REGISTERED: "mobile.device_registered",
  MOBILE_DEVICE_REVOKED: "mobile.device_revoked",
  MOBILE_PUSH_TOKEN: "mobile.push_token_registered",
  PUSH_DELIVERED: "push.delivered",
  NOTIFICATION_READ: "notification.read",
  MOBILE_DASHBOARD: "mobile.dashboard_access",
  MOBILE_CASE_ACCESS: "mobile.case_access",
  MOBILE_DOCUMENT_ACCESS: "mobile.document_access",
  MOBILE_AI_USAGE: "mobile.ai_usage",
} as const;

export const SUPABASE_REALTIME_CHANNELS = {
  cases: "sanson:cases",
  appointments: "sanson:appointments",
  documents: "sanson:documents",
  tasks: "sanson:tasks",
  comments: "sanson:comments",
  timelines: "sanson:timelines",
  notifications: "sanson:notifications",
} as const;

export const API_VERSION = "v1";
export const API_BASE_PATH = `/api/${API_VERSION}`;

