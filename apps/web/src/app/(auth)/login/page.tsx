"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { inferRoleFromEmail, resolveSyncProfileNames } from "@sanson/shared";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@sanson/ui";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { formatFirebaseAuthError } from "@/lib/auth-errors";
import { api } from "@/lib/api";
import { getDashboardPath as pathForRole } from "@sanson/utils";
import { friendlySyncError } from "@/lib/user-messages";
import type { UserRole } from "@sanson/types";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken, getDashboardPath } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSyncAndRedirect = async (token: string, userEmail: string, profile?: {
    first_name?: string;
    last_name?: string;
  }) => {
    setToken(token);
    api.setToken(token);
    const names = resolveSyncProfileNames(userEmail, profile);
    const response = await api.syncUser({
      ...names,
      role: inferRoleFromEmail(userEmail),
    });

    if (!response.success || !response.data?.user) {
      setError(friendlySyncError());
      return;
    }

    const user = response.data.user;
    setUser(user);
    const role = user.role?.name as UserRole | undefined;
    router.push(role ? pathForRole(role) : getDashboardPath());
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isFirebaseConfigured()) {
      setError("Sign-in is temporarily unavailable. Please contact your administrator.");
      setLoading(false);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      await handleSyncAndRedirect(token, email);
    } catch (err: unknown) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    if (!isFirebaseConfigured()) {
      setError("Sign-in is temporarily unavailable. Please contact your administrator.");
      setLoading(false);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithPopup(auth, googleProvider);
      const token = await credential.user.getIdToken();
      const displayName = credential.user.displayName?.split(" ") ?? [];
      const userEmail = credential.user.email ?? "";
      await handleSyncAndRedirect(token, userEmail, {
        first_name: displayName[0] || "User",
        last_name: displayName.slice(1).join(" ") || "",
      });
    } catch (err: unknown) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-gradient flex flex-1 items-center justify-center p-4 py-8 safe-bottom">
      <Card className="sanson-auth-card w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your firm credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@sansonlaw.ph"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-pink-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button variant="secondary" className="w-full" onClick={handleGoogleLogin} loading={loading}>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-zinc-300">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-pink-400 hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
