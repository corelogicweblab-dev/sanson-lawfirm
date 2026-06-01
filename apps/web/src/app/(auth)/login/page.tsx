"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@sanson/ui";
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

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken, getDashboardPath } = useAuthStore();
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
      const result = await syncFirebaseUser(credential.user);
      if (result.ok) {
        finishAuth(result.user, token, result.redirectPath);
      } else {
        setError(result.message);
      }
    } catch (err: unknown) {
      setError(firebaseAuthErrorMessage(err));
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

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleGoogleLogin}
            loading={loading}
            disabled={!isFirebaseConfigured()}
          >
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
