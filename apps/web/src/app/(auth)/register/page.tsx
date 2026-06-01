"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { Scale } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@sanson/ui";
import { inferRoleFromEmail, resolveSyncProfileNames } from "@sanson/shared";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithGoogle } from "@/lib/google-auth";
import {
  firebaseAuthErrorMessage,
  syncFirebaseUser,
  syncFromGoogleCredential,
} from "@/lib/firebase-auth-flow";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useGoogleAuthRedirect } from "@/hooks/use-google-auth-redirect";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken, getDashboardPath } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const finishAuth = useCallback(
    (user: import("@sanson/types").User, token: string, redirectPath?: string) => {
      setToken(token);
      api.setToken(token);
      setUser(user);
      router.push(redirectPath ?? getDashboardPath());
    },
    [getDashboardPath, router, setToken, setUser]
  );

  useGoogleAuthRedirect({
    setLoading,
    onError: setError,
    onSuccess: async ({ user, redirectPath }) => {
      const auth = getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      if (token) finishAuth(user, token, redirectPath);
    },
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isFirebaseConfigured()) {
      setError("Registration is temporarily unavailable. Please contact SANSON Law Firm.");
      setLoading(false);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });
      const token = await credential.user.getIdToken();
      const names = resolveSyncProfileNames(email, {
        first_name: firstName,
        last_name: lastName,
      });
      setToken(token);
      api.setToken(token);
      const response = await api.syncUser({
        ...names,
        role: inferRoleFromEmail(email),
      });
      if (response.success && response.data?.user) {
        finishAuth(response.data.user, token);
      } else {
        setError("Registration could not be completed. Please try again.");
      }
    } catch (err: unknown) {
      setError(firebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);

    if (!isFirebaseConfigured()) {
      setError("Registration is temporarily unavailable. Please contact SANSON Law Firm.");
      setLoading(false);
      return;
    }

    try {
      const credential = await signInWithGoogle();
      const token = await credential.user.getIdToken();
      const result = await syncFromGoogleCredential(credential);
      if (result.ok) {
        finishAuth(result.user, token, result.redirectPath);
      } else {
        setError(result.message);
      }
    } catch (err: unknown) {
      const msg = firebaseAuthErrorMessage(err);
      if (msg.includes("Redirecting to Google")) {
        setError("");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-gradient flex flex-1 items-center justify-center p-4 py-8 safe-bottom">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join SANSON Legal OS — free AI consultation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              minLength={6}
            />
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleGoogleRegister}
            loading={loading}
            disabled={!isFirebaseConfigured()}
          >
            Sign up with Google
          </Button>

          <p className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="text-pink-400 hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
