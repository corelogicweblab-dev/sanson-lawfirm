import type { User } from "@sanson/types";

export type FirmUserProfileSeed = {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  /** Shown in header profile menu (e.g. Managing Partner / CEO) */
  title?: string;
};

/** Official SANSON Law Firm accounts — names applied on login sync. */
export const FIRM_USER_PROFILES: Record<string, FirmUserProfileSeed> = {
  "lawyer@sansonlaw.ph": {
    first_name: "Rosebelle",
    middle_name: "L.",
    last_name: "Sanson",
    title: "Managing Partner / CEO",
  },
  "admin@sansonlaw.ph": {
    first_name: "SANSON",
    last_name: "Administrator",
    title: "System Administrator",
  },
  "paralegal@sansonlaw.ph": {
    first_name: "SANSON",
    last_name: "Paralegal",
    title: "Paralegal Operations",
  },
  "client@sansonlaw.ph": {
    first_name: "Demo",
    last_name: "Client",
    title: "Client Portal",
  },
};

export function getFirmProfileForEmail(email: string): FirmUserProfileSeed | undefined {
  return FIRM_USER_PROFILES[email.trim().toLowerCase()];
}

/** Names sent to POST /auth/sync when Firebase has no displayName. */
export function resolveSyncProfileNames(
  email: string,
  firebase?: { first_name?: string; last_name?: string }
): { first_name: string; last_name: string; middle_name?: string } {
  const firm = getFirmProfileForEmail(email);
  if (firm) {
    return {
      first_name: firm.first_name,
      middle_name: firm.middle_name ?? undefined,
      last_name: firm.last_name,
    };
  }
  return {
    first_name: firebase?.first_name?.trim() || "User",
    last_name: firebase?.last_name?.trim() || "",
  };
}

function isPlaceholderName(first: string, last: string): boolean {
  const f = first.trim().toLowerCase();
  const l = last.trim().toLowerCase();
  return (f === "user" && (l === "user" || l === "")) || (!f && !l);
}

export function formatUserDisplayName(user: User | null | undefined): string {
  if (!user) return "User";
  const p = user.profile;
  if (p) {
    const parts = [p.first_name, p.middle_name, p.last_name, p.suffix].filter(
      (x) => x && String(x).trim()
    );
    const built = parts.join(" ").trim();
    if (built && !isPlaceholderName(p.first_name, p.last_name)) {
      return built;
    }
  }
  const firm = getFirmProfileForEmail(user.email);
  if (firm) {
    return [firm.first_name, firm.middle_name, firm.last_name, firm.suffix]
      .filter((x) => x && String(x).trim())
      .join(" ");
  }
  return user.email;
}

export function getUserTitle(user: User | null | undefined): string | undefined {
  if (!user) return undefined;
  const firm = getFirmProfileForEmail(user.email);
  return firm?.title;
}
