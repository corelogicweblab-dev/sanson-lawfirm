import type { User as FirebaseUser, UserCredential } from "firebase/auth";
import { inferRoleFromEmail, resolveSyncProfileNames } from "@sanson/shared";
import type { ApiResponse, User, UserRole } from "@sanson/types";
import { getDashboardPath as pathForRole } from "@sanson/utils";
import { api } from "@/lib/api";
import { extractApiErrorMessage } from "@/lib/api-error";
import { isProductionHosting } from "@/lib/api-request";
import { formatFirebaseAuthError } from "@/lib/auth-errors";
import { friendlyNetworkError, friendlySyncError } from "@/lib/user-messages";
import { useAuthStore } from "@/store/auth";

export type AuthFlowResult =
  | { ok: true; user: User; redirectPath: string; token: string }
  | { ok: false; message: string };

/** One sync at a time — login page + AuthProvider share the same Firebase event. */
let syncInflight: Promise<AuthFlowResult> | null = null;
let lastSyncedUid: string | null = null;

export function namesFromFirebaseUser(firebaseUser: FirebaseUser) {
  const displayName = firebaseUser.displayName?.split(" ") ?? [];
  const email = firebaseUser.email?.trim() ?? "";
  return {
    email,
    names: resolveSyncProfileNames(email, {
      first_name: displayName[0] || "User",
      last_name: displayName.slice(1).join(" ") || "",
    }),
  };
}

function resolveSyncFailureMessage(
  response: ApiResponse<{ user: User; is_new_user: boolean }> | null,
  networkMessage?: string
): string {
  if (networkMessage) {
    if (/cannot reach|waking up|connection blocked|too long/i.test(networkMessage)) {
      return networkMessage;
    }
    return friendlyNetworkError();
  }

  const msg = extractApiErrorMessage(
    (response ?? undefined) as unknown as Record<string, unknown> | undefined,
    ""
  );
  if (!msg) return friendlySyncError();

  const lower = msg.toLowerCase();
  if (lower.includes("authentication token required") || lower.includes("auth_required")) {
    return "Session could not be sent to the firm server. Please try Sign In again.";
  }
  if (lower.includes("invalid firebase token") || lower.includes("invalid_token")) {
    return "Sign-in session expired. Close this tab, open the site again, and sign in.";
  }
  if (
    lower.includes("database") ||
    lower.includes("supabase") ||
    lower.includes("migration") ||
    lower.includes("schema") ||
    lower.includes("walang roles")
  ) {
    return msg;
  }
  if (msg.length <= 280) return msg;
  return friendlySyncError();
}

function sessionAlreadyReady(firebaseUser: FirebaseUser): AuthFlowResult | null {
  const { isAuthenticated, user, firebaseToken } = useAuthStore.getState();
  if (!isAuthenticated || !user || !firebaseToken) return null;
  const email = firebaseUser.email?.trim().toLowerCase();
  if (!email || user.email?.trim().toLowerCase() !== email) return null;
  const role = user.role?.name as UserRole | undefined;
  return {
    ok: true,
    user,
    token: firebaseToken,
    redirectPath: role ? pathForRole(role) : "/dashboard/client",
  };
}

async function performSync(firebaseUser: FirebaseUser): Promise<AuthFlowResult> {
  const email = firebaseUser.email?.trim();
  if (!email) {
    return { ok: false, message: formatFirebaseAuthError(new Error("GOOGLE_NO_EMAIL")) };
  }

  const cached = sessionAlreadyReady(firebaseUser);
  if (cached) return cached;

  try {
    const token = await firebaseUser.getIdToken();
    api.setToken(token);

    const { names } = namesFromFirebaseUser(firebaseUser);
    const payload = { ...names, role: inferRoleFromEmail(email) };

    let response = await api.syncUser(payload);
    if ((!response.success || !response.data?.user) && isProductionHosting()) {
      await new Promise((r) => setTimeout(r, 1200));
      response = await api.syncUser(payload);
    }

    if (!response.success || !response.data?.user) {
      return { ok: false, message: resolveSyncFailureMessage(response) };
    }

    const user = response.data.user;
    const role = user.role?.name as UserRole | undefined;
    lastSyncedUid = firebaseUser.uid;
    return {
      ok: true,
      user,
      token,
      redirectPath: role ? pathForRole(role) : "/dashboard/client",
    };
  } catch (err) {
    const networkMessage = err instanceof Error ? err.message : undefined;
    return { ok: false, message: resolveSyncFailureMessage(null, networkMessage) };
  }
}

export async function syncFirebaseUser(firebaseUser: FirebaseUser): Promise<AuthFlowResult> {
  if (syncInflight && lastSyncedUid === firebaseUser.uid) {
    return syncInflight;
  }

  syncInflight = performSync(firebaseUser).finally(() => {
    syncInflight = null;
  });
  return syncInflight;
}

export async function syncFromGoogleCredential(
  credential: UserCredential
): Promise<AuthFlowResult> {
  return syncFirebaseUser(credential.user);
}

export function firebaseAuthErrorMessage(err: unknown): string {
  return formatFirebaseAuthError(err);
}
