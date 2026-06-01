/** Map Firebase Auth error codes to user-facing messages. */
export function formatFirebaseAuthError(err: unknown): string {
  if (err instanceof Error && err.message === "GOOGLE_REDIRECT_STARTED") {
    return "Redirecting to Google…";
  }
  if (err instanceof Error && err.message === "GOOGLE_NO_EMAIL") {
    return "Your Google account has no email on file. Please register with email and password instead.";
  }

  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: string }).code)
      : "";

  const messages: Record<string, string> = {
    "auth/configuration-not-found":
      "Sign-in is not fully set up yet. Please contact SANSON Law Firm support.",
    "auth/operation-not-allowed":
      "Google sign-in is not enabled for this app. Please contact SANSON Law Firm support.",
    "auth/user-not-found": "No account found for this email. Try Register or use Google sign-in.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Invalid email or password. Try again or use Continue with Google.",
    "auth/invalid-email": "Invalid email address format.",
    "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/unauthorized-domain":
      "This website is not authorized for Google sign-in. Please contact SANSON Law Firm support.",
    "auth/popup-blocked":
      "Your browser blocked the sign-in window. Trying Google redirect…",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/cancelled-popup-request": "Sign-in was interrupted. Please try again.",
    "auth/account-exists-with-different-credential":
      "This email is already registered with a password. Sign in with email and password instead.",
    "auth/email-already-in-use": "This email already has an account. Sign in instead of registering again.",
    "auth/api-key-not-valid":
      "Invalid Firebase API key on this site. In Netlify, set NEXT_PUBLIC_FIREBASE_API_KEY from Firebase Console (Project settings → Your apps → Web app), then Clear cache and redeploy. Also add your Netlify URL under Firebase Authentication → Authorized domains.",
    "auth/invalid-api-key":
      "Invalid Firebase API key on this site. In Netlify, set NEXT_PUBLIC_FIREBASE_API_KEY from Firebase Console (Project settings → Your apps → Web app), then Clear cache and redeploy. Also add your Netlify URL under Firebase Authentication → Authorized domains.",
  };

  if (code && messages[code]) return messages[code];
  if (err instanceof Error && err.message && err.message !== "GOOGLE_REDIRECT_STARTED") {
    return err.message;
  }
  return "Sign-in failed. Please try again.";
}
