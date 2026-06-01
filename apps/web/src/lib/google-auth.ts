import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";

/** Prefer account picker on repeat visits. */
googleProvider.setCustomParameters({ prompt: "select_account" });

const REDIRECT_PENDING_KEY = "sanson-google-redirect";

export function markGoogleRedirectPending(): void {
  try {
    sessionStorage.setItem(REDIRECT_PENDING_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function clearGoogleRedirectPending(): void {
  try {
    sessionStorage.removeItem(REDIRECT_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function isGoogleRedirectPending(): boolean {
  try {
    return sessionStorage.getItem(REDIRECT_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

function shouldUseRedirect(err: unknown): boolean {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: string }).code)
      : "";
  return (
    code === "auth/popup-blocked" ||
    code === "auth/cancelled-popup-request" ||
    code === "auth/operation-not-supported-in-this-environment"
  );
}

/** Sign in with Google — popup first, redirect if the browser blocks popups. */
export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    if (shouldUseRedirect(err)) {
      markGoogleRedirectPending();
      await signInWithRedirect(auth, googleProvider);
      throw new Error("GOOGLE_REDIRECT_STARTED");
    }
    throw err;
  }
}

/** After returning from Google redirect, complete sign-in once. */
export async function completeGoogleRedirectSignIn(): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  const result = await getRedirectResult(auth);
  clearGoogleRedirectPending();
  return result;
}
