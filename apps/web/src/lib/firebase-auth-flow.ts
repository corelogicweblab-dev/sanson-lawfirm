import type { User as FirebaseUser, UserCredential } from "firebase/auth";
import { inferRoleFromEmail, resolveSyncProfileNames } from "@sanson/shared";
import type { User, UserRole } from "@sanson/types";
import { getDashboardPath as pathForRole } from "@sanson/utils";
import { api } from "@/lib/api";
import { formatFirebaseAuthError } from "@/lib/auth-errors";
import { friendlySyncError } from "@/lib/user-messages";

export type AuthFlowResult =
  | { ok: true; user: User; redirectPath: string }
  | { ok: false; message: string };

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

export async function syncFirebaseUser(
  firebaseUser: FirebaseUser
): Promise<AuthFlowResult> {
  const email = firebaseUser.email?.trim();
  if (!email) {
    return { ok: false, message: formatFirebaseAuthError(new Error("GOOGLE_NO_EMAIL")) };
  }

  const token = await firebaseUser.getIdToken();
  const { names } = namesFromFirebaseUser(firebaseUser);
  const response = await api.syncUser({
    ...names,
    role: inferRoleFromEmail(email),
  });

  if (!response.success || !response.data?.user) {
    return { ok: false, message: friendlySyncError() };
  }

  const user = response.data.user;
  const role = user.role?.name as UserRole | undefined;
  return {
    ok: true,
    user,
    redirectPath: role ? pathForRole(role) : "/dashboard/client",
  };
}

export async function syncFromGoogleCredential(
  credential: UserCredential
): Promise<AuthFlowResult> {
  return syncFirebaseUser(credential.user);
}

export function firebaseAuthErrorMessage(err: unknown): string {
  return formatFirebaseAuthError(err);
}
