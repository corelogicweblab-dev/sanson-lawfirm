export type UserRole = "CLIENT" | "LAWYER" | "PARALEGAL" | "ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type CaseCategory =
  | "CRIMINAL"
  | "CIVIL"
  | "FAMILY"
  | "LABOR"
  | "CYBERCRIME"
  | "ADMINISTRATIVE"
  | "CORPORATE"
  | "PROPERTY"
  | "CONTRACT_DISPUTES"
  | "CONSUMER_PROTECTION"
  | "OTHER";

export type LegalRequestStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "WAITING_FOR_SCHEDULE"
  | "SCHEDULED"
  | "CONSULTED"
  | "APPROVED"
  | "DECLINED"
  | "CONVERTED_TO_CASE";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type ConsultationType = "ONLINE" | "ONSITE";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta: Record<string, unknown> | null;
  errors: ApiError[] | null;
}

export interface ApiError {
  field?: string;
  code: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  phone: string | null;
  address: string | null;
  profile_photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  role_id: string;
  role: Role;
  status: UserStatus;
  is_active: boolean;
  last_login_at: string | null;
  profile: UserProfile | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: UserRole;
  display_name: string;
  description: string | null;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  module: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  performed_by: string | null;
  ip_address: string | null;
  user_agent: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuthSyncRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthSyncResponse {
  user: User;
  is_new_user: boolean;
}

export interface DashboardStats {
  total_users: number;
  clients: number;
  lawyers: number;
  paralegals: number;
  admins: number;
}

export interface LegalRequest {
  id: string;
  client_id: string;
  request_reference: string;
  case_category: CaseCategory;
  subject: string;
  description: string;
  status: LegalRequestStatus;
  priority: PriorityLevel;
  requested_at: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  request_id: string;
  client_id: string;
  lawyer_id: string | null;
  appointment_date: string;
  appointment_time: string;
  consultation_type: ConsultationType;
  status: AppointmentStatus;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseStatus {
  id: string;
  name: string;
  display_name: string;
  color?: string;
  is_terminal: boolean;
}

export interface CaseItem {
  id: string;
  case_number: string;
  request_id: string | null;
  client_id: string;
  assigned_lawyer_id: string | null;
  assigned_paralegal_id: string | null;
  status: CaseStatus | null;
  case_category: CaseCategory;
  title: string;
  description: string | null;
  priority: PriorityLevel;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: string;
  case_id: string | null;
  request_id: string | null;
  assigned_to: string | null;
  created_by: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: PriorityLevel;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  event_type: string;
  event_date: string;
  title: string;
  description: string | null;
  source: string;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  roles?: UserRole[];
}

export interface WorkflowStats {
  total_requests: number;
  consultations_scheduled: number;
  active_cases: number;
  pending_tasks: number;
  case_status_distribution: Record<string, number>;
}

