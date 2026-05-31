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

  TASKS_READ: "tasks:read",
  TASKS_WRITE: "tasks:write",

  COMMENTS_READ: "comments:read",
  COMMENTS_WRITE: "comments:write",

  CONSULTATIONS_READ: "consultations:read",
  CONSULTATIONS_WRITE: "consultations:write",

  TIMELINES_READ: "timelines:read",
  TIMELINES_WRITE: "timelines:write",
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
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.COMMENTS_READ,
    PERMISSIONS.COMMENTS_WRITE,
    PERMISSIONS.CONSULTATIONS_READ,
    PERMISSIONS.CONSULTATIONS_WRITE,
    PERMISSIONS.TIMELINES_READ,
    PERMISSIONS.TIMELINES_WRITE,
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
    PERMISSIONS.TIMELINES_READ,
    PERMISSIONS.TIMELINES_WRITE,
  ],
  ADMIN: ["*"],
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
} as const;

export const API_VERSION = "v1";
export const API_BASE_PATH = `/api/${API_VERSION}`;

