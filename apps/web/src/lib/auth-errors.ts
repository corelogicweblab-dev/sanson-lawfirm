/** Map Firebase Auth error codes to actionable messages. */
export function formatFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: string }).code)
      : "";

  const messages: Record<string, string> = {
    "auth/configuration-not-found":
      "Email/Password login is not enabled. Firebase Console → Authentication → Sign-in method → enable Email/Password, then try again.",
    "auth/operation-not-allowed":
      "This sign-in method is disabled. Enable Email/Password (and Google if needed) in Firebase Authentication.",
    "auth/user-not-found":
      "No Firebase account for this email. Create the user in Firebase Console → Authentication → Users → Add user.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Invalid email or password. Check the account exists in Firebase Authentication.",
    "auth/invalid-email": "Invalid email address format.",
    "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/unauthorized-domain":
      "This site is not authorized. Add sansonlawfirm.web.app to Firebase → Authentication → Settings → Authorized domains.",
  };

  if (code && messages[code]) return messages[code];
  if (err instanceof Error) return err.message;
  return "Login failed. Please try again.";
}
