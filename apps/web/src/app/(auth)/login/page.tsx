"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Scale } from "lucide-react";
import { inferRoleFromEmail, resolveSyncProfileNames } from "@sanson/shared";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@sanson/ui";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { formatFirebaseAuthError } from "@/lib/auth-errors";
import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api-url";
import { getDashboardPath as pathForRole } from "@sanson/utils";
import type { UserRole } from "@sanson/types";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken, getDashboardPath } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    const base = getApiBaseUrl();

    const check = async (attempt: number) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25_000);
      try {
        const r = await fetch(`${base}/api/v1/health/ready`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const body = (await r.json()) as {
          data?: {
            database?: string;
            database_url_issues?: string[];
            database_error?: string | null;
            hint?: string | null;
          };
        };
        if (body?.data?.database === "connected") {
          setApiOk(true);
          setApiStatus(null);
          return;
        }
        setApiOk(false);
        const issues = body?.data?.database_url_issues ?? [];
        if (issues.length > 0) {
          setApiStatus(
            `Mali ang format ng DATABASE_URL: ${issues[0]} Dapat colon (:) bago password, hindi tuldok (.).`
          );
          return;
        }
        const detail = body?.data?.database_error || body?.data?.hint;
        setApiStatus(
          detail ||
            "Database offline sa Render. I-save ang DATABASE_URL → Manual Deploy → hintayin Live, tapos refresh."
        );
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000));
          return check(attempt + 1);
        }
        setApiOk(false);
        setApiStatus(
          `Hindi maabot ang API (${base}). Kung bagong deploy, hintayin 1–2 minuto (Render cold start) tapos i-refresh.`
        );
      } finally {
        clearTimeout(timer);
      }
    };

    check(1);
  }, []);

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
      setError(
        response.message ||
          "Hindi ma-sync ang user. Karaniwang sanhi: database offline sa Render (tingnan /health/ready)."
      );
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
      setError("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
      setLoading(false);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      await handleSyncAndRedirect(token, email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    if (!isFirebaseConfigured()) {
      setError("Firebase is not configured.");
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

  const roleHint = email ? inferRoleFromEmail(email) : null;

  return (
    <div className="auth-gradient flex flex-1 items-center justify-center p-4 py-8 safe-bottom">
      <Card className="sanson-auth-card w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Access your SANSON Legal OS portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sansonlaw.ph"
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
            {roleHint && roleHint !== "CLIENT" && (
              <p className="text-xs text-zinc-500">
                Dashboard: <span className="text-pink-400">{roleHint}</span>
              </p>
            )}
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-pink-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            {apiOk === true && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                API at database connected sa Render — puwede nang mag-sign in.
              </p>
            )}
            {apiStatus && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {apiStatus}
              </p>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
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
