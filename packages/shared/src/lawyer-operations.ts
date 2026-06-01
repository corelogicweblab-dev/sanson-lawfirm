import type { CaseItem, PriorityLevel, TaskItem } from "@sanson/types";

/** Lawyer command center — decision-maker workflow (paralegals build, lawyers approve). */
export const LAWYER_CASE_WORKFLOW = [
  { step: 1, label: "Paralegal prepares case", owner: "PARALEGAL" as const },
  { step: 2, label: "Documents & evidence filed", owner: "PARALEGAL" as const },
  { step: 3, label: "Lawyer review", owner: "LAWYER" as const },
  { step: 4, label: "Legal strategy & notes", owner: "LAWYER" as const },
  { step: 5, label: "Approvals & court prep", owner: "LAWYER" as const },
  { step: 6, label: "Active representation", owner: "LAWYER" as const },
  { step: 7, label: "Closure", owner: "LAWYER" as const },
] as const;

export const LAWYER_PENDING_STATUSES = [
  "UNDER_REVIEW",
  "OPEN",
  "WAITING_DOCUMENTS",
  "DRAFT",
] as const;

export const LAWYER_CASE_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending review" },
  { id: "closed", label: "Closed" },
  { id: "CIVIL", label: "Civil" },
  { id: "CRIMINAL", label: "Criminal" },
  { id: "LABOR", label: "Labor" },
  { id: "FAMILY", label: "Family" },
  { id: "ADMINISTRATIVE", label: "Administrative" },
  { id: "HIGH", label: "High priority" },
  { id: "URGENT", label: "Urgent" },
] as const;

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function computeCaseRiskScore(caseItem: CaseItem): { level: RiskLevel; score: number; label: string } {
  let score = 0;
  const p = caseItem.priority;
  if (p === "URGENT") score += 40;
  else if (p === "HIGH") score += 28;
  else if (p === "MEDIUM") score += 12;

  const status = caseItem.status?.name ?? "";
  if (LAWYER_PENDING_STATUSES.includes(status as (typeof LAWYER_PENDING_STATUSES)[number])) score += 20;
  if (!caseItem.description?.trim()) score += 10;

  const master = caseItem.master_data ?? {};
  const dates = master.important_dates as Record<string, string> | undefined;
  if (dates?.next_deadline || dates?.hearing_date) score += 15;

  let level: RiskLevel = "LOW";
  if (score >= 55) level = "CRITICAL";
  else if (score >= 38) level = "HIGH";
  else if (score >= 20) level = "MEDIUM";

  const label =
    level === "CRITICAL" ? "Critical" : level === "HIGH" ? "High" : level === "MEDIUM" ? "Medium" : "Low";

  return { level, score: Math.min(100, score), label };
}

export function isCasePendingLawyerReview(c: CaseItem): boolean {
  const s = c.status?.name ?? "";
  return LAWYER_PENDING_STATUSES.includes(s as (typeof LAWYER_PENDING_STATUSES)[number]);
}

export function filterLawyerCases(
  cases: CaseItem[],
  filterId: string
): CaseItem[] {
  if (filterId === "all") return cases;
  if (filterId === "active")
    return cases.filter((c) => c.status?.name !== "CLOSED" && c.status?.name !== "ARCHIVED");
  if (filterId === "pending") return cases.filter(isCasePendingLawyerReview);
  if (filterId === "closed") return cases.filter((c) => c.status?.name === "CLOSED");
  if (filterId === "HIGH" || filterId === "URGENT")
    return cases.filter((c) => c.priority === filterId);
  return cases.filter((c) => c.case_category === filterId);
}

export function countOverdueTasks(tasks: TaskItem[]): number {
  const now = Date.now();
  return tasks.filter(
    (t) =>
      t.status !== "COMPLETED" &&
      t.status !== "CANCELLED" &&
      t.due_date &&
      new Date(t.due_date).getTime() < now
  ).length;
}

export const LAWYER_NOTEBOOK_CATEGORIES = [
  "Private lawyer notes",
  "Strategy",
  "Court preparation",
  "Settlement",
  "Evidence review",
  "Client discussion",
  "Risk analysis",
] as const;

export const LAWYER_AI_DRAFT_TYPES = [
  "Demand letter",
  "Legal opinion",
  "Affidavit draft",
  "Motion draft",
  "Client letter",
  "Memorandum",
  "Notice",
  "Contract draft",
] as const;
