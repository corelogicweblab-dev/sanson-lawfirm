import { signOut } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth";

export const LANDING_PATH = "/";

/** Clear session and always return user to the public landing page. */
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
  window.location.replace(LANDING_PATH);
}
