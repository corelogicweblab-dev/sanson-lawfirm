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
  | "IMMIGRATION"
  | "ESTATE_PROBATE"
  | "TAX"
  | "OTHER";

export type ChatSessionStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
export type ChatSenderType = "CLIENT" | "AI" | "SYSTEM";
export type AiUrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AiRecommendationType =
  | "CONTINUE_CONVERSATION"
  | "UPLOAD_DOCUMENTS"
  | "GATHER_EVIDENCE"
  | "REQUEST_REPRESENTATION"
  | "SEEK_IMMEDIATE_ADVICE";
export type SessionDecision = "CONTINUE_CHAT" | "RETURN_LATER" | "REQUEST_LEGAL_REPRESENTATION";

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
  nickname: string | null;
  date_of_birth: string | null;
  profile_photo: string | null;
  profile_photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdatePayload {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  suffix?: string | null;
  phone?: string | null;
  address?: string | null;
  nickname?: string | null;
  date_of_birth?: string | null;
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
  middle_name?: string;
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

export type CaseSourceType =
  | "LEGACY"
  | "AI_INTAKE"
  | "MANUAL"
  | "WALK_IN"
  | "REFERRAL"
  | "PHONE_INQUIRY"
  | "EMAIL_INQUIRY";

export interface LawyerDashboardStats {
  active_cases: number;
  pending_review: number;
  urgent_high: number;
  pending_approvals: number;
  open_tasks: number;
  overdue_tasks: number;
  appointments_pending: number;
  todays_consultations: number;
  documents_total: number;
  documents_pending_review: number;
  evidence_total: number;
  evidence_pending_validation: number;
  pending_requests: number;
  ai_analyses_today: number;
  notifications_unread: number;
}

export interface LawyerDashboardPayload {
  stats: LawyerDashboardStats;
  preview_cases: CaseItem[];
}

export interface CaseItem {
  id: string;
  case_number: string;
  request_id: string | null;
  source_type?: CaseSourceType;
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
  master_data?: Record<string, unknown>;
  parties?: Array<Record<string, unknown>>;
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

export interface ChatSession {
  id: string;
  clientId: string;
  sessionReference: string;
  status: ChatSessionStatus;
  legalRequestId: string | null;
  startedAt: string;
  lastActivityAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: ChatSenderType;
  message: string;
  messageType: string;
  tokenUsage: number | null;
  createdAt: string;
}

export interface AiClassification {
  id: string;
  sessionId: string;
  category: CaseCategory | null;
  subcategory: string | null;
  priority: PriorityLevel | null;
  urgency: AiUrgencyLevel | null;
  confidenceScore: number | null;
  potentialLegalArea: string | null;
  createdAt: string;
}

export interface AiSummary {
  id: string;
  sessionId: string;
  clientId: string;
  summaryText: string;
  keyFacts: string[];
  partiesInvolved: string[];
  relevantDates: string[];
  evidenceMentioned: string[];
  missingInformation: string[];
  recommendedNextSteps: string[];
  urgency: AiUrgencyLevel | null;
  classificationId: string | null;
  generatedAt: string;
}

export interface AiRecommendation {
  id: string;
  sessionId: string;
  recommendationType: AiRecommendationType;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SessionInsights {
  classification: AiClassification | null;
  summary: AiSummary | null;
  recommendations: AiRecommendation[];
  intakeResponses: Array<{
    id: string;
    questionKey: string;
    questionText: string;
    answerText: string;
  }>;
}

export type DocumentVisibility = "PRIVATE" | "CLIENT" | "STAFF" | "CASE_TEAM";
export type DocumentReviewStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";
export type EvidenceType =
  | "PHOTO"
  | "SCREENSHOT"
  | "VIDEO_REFERENCE"
  | "DOCUMENT"
  | "CONTRACT"
  | "RECEIPT"
  | "MEDICAL_RECORD"
  | "COMMUNICATION_RECORD"
  | "OTHER";

export interface DocumentCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  sortOrder: number;
}

export interface DocumentItem {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  categoryId: string | null;
  category: DocumentCategory | null;
  caseId: string | null;
  legalRequestId: string | null;
  visibility: DocumentVisibility;
  reviewStatus: DocumentReviewStatus;
  versionNumber: number;
  keywords: string[];
  downloadUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAnalysisResult {
  id: string;
  documentId: string;
  summaryText: string | null;
  importantFindings: string[];
  parties: string[];
  datesFound: string[];
  legalSignificance: string | null;
  riskIndicators: string[];
  missingAttachments: string[];
  extractedEntities: Record<string, unknown>;
  keywords: string[];
  generatedAt: string;
}

export interface EvidenceItemRecord {
  id: string;
  documentId: string | null;
  caseId: string | null;
  legalRequestId: string | null;
  evidenceType: EvidenceType;
  title: string;
  description: string | null;
  status: string;
  ownerId: string;
  createdAt: string;
}

export interface EvidenceTimelineEvent {
  id: string;
  eventDate: string;
  eventTitle: string;
  eventDescription: string | null;
  location: string | null;
  people: string[];
  organizations: string[];
  sourceType: string;
  confidenceScore: number | null;
}

export type SearchMode = "SEMANTIC" | "KEYWORD" | "HYBRID" | "METADATA";

export interface SearchResultItem {
  title: string;
  type: string;
  relevanceScore: number;
  rankingScore: number;
  confidenceScore: number;
  summary: string;
  source: string;
  sourceId: string | null;
  date: string | null;
  openAction: string | null;
}

export interface KnowledgeCategoryItem {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  sortOrder: number;
}

export interface KnowledgeArticleItem {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  category: KnowledgeCategoryItem | null;
  content: string;
  summary: string | null;
  visibility: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHistoryItem {
  id: string;
  queryText: string;
  searchMode: SearchMode;
  createdAt: string;
}

export interface MobileNotification {
  id: string;
  channel: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string | null;
}

export interface MobileDashboardWidgets {
  recentAiConversations?: { id: string; status: string }[];
  pendingRequests?: number;
  upcomingAppointments?: { id: string; date: string; status: string }[];
  activeCases?: { id: string; title: string }[];
  todaysConsultations?: number;
  urgentCases?: number;
  pendingReviews?: number;
  assignedTasks?: number;
  totalUsers?: number;
  recentNotifications?: { id: string; title: string; body: string; isRead: boolean }[];
}

export interface MobileDashboard {
  role: UserRole;
  widgets: MobileDashboardWidgets;
  quickActions: { label: string; route: string }[];
}

export interface SyncEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string | null;
  payload: Record<string, unknown>;
  channelName: string | null;
  createdAt: string | null;
}

