import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { formatFirebaseAuthError } from "@/lib/auth-errors";

export async function reauthenticateWithPassword(
  email: string,
  currentPassword: string
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const credential = EmailAuthProvider.credential(email, currentPassword);
  await reauthenticateWithCredential(user, credential);
}

export async function changeAccountEmail(
  newEmail: string,
  currentPassword: string
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Not signed in");
  try {
    await reauthenticateWithPassword(user.email, currentPassword);
    await updateEmail(user, newEmail.trim().toLowerCase());
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err));
  }
}

export async function changeAccountPassword(
  newPassword: string,
  currentPassword: string
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Not signed in");
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  try {
    await reauthenticateWithPassword(user.email, currentPassword);
    await updatePassword(user, newPassword);
  } catch (err) {
    throw new Error(formatFirebaseAuthError(err));
  }
}
