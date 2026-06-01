import type { UserRole } from "@sanson/types";
import { ROLE_DASHBOARD_PATH } from "@sanson/shared";

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatFullName(
  firstName: string,
  lastName: string,
  middleName?: string | null,
  suffix?: string | null
): string {
  const parts = [firstName, middleName, lastName, suffix].filter(Boolean);
  return parts.join(" ");
}

export function getDashboardPath(role: UserRole): string {
  return ROLE_DASHBOARD_PATH[role] ?? "/dashboard/client";
}

export function hasPermission(
  userPermissions: string[],
  required: string | string[]
): boolean {
  if (userPermissions.includes("*")) return true;
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.some((p) => userPermissions.includes(p));
}

/** Age in full years from ISO date (YYYY-MM-DD). */
export function calculateAge(dateOfBirth: string | Date | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth + "T12:00:00") : dateOfBirth;
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
