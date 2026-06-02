import { signOut } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { navigateToLogin } from "@/lib/static-navigation";
import { useAuthStore } from "@/store/auth";

export const LANDING_PATH = "/";

/** Clear session and return to sign-in (full page load — avoids /login/index.txt on Netlify). */
export async function performLogoutAndRedirect(): Promise<void> {
  const { logout } = useAuthStore.getState();
  await logout();
  if (isFirebaseConfigured()) {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      /* ignore */
    }
  }
  navigateToLogin();
}
