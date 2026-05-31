"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Scale } from "lucide-react";
import { Button, Input, PoweredByCoreLogic, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@sanson/ui";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { formatFirebaseAuthError } from "@/lib/auth-errors";
import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api-url";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken, getDashboardPath } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<string | null>(null);

  useEffect(() => {
    const base = getApiBaseUrl();
    fetch(`${base}/api/v1/health/ready`)
      .then((r) => r.json())
      .then((body: { data?: { database?: string } }) => {
        if (body?.data?.database === "connected") {
          setApiStatus(null);
        } else {
          setApiStatus(
            "API database is offline on Render. Login will fail until DATABASE_URL is fixed in Render → Environment."
          );
        }
      })
      .catch(() => {
        setApiStatus(`Cannot reach API at ${base}. Check Render service and redeploy web.`);
      });
  }, []);

  const handleSyncAndRedirect = async (token: string) => {
    setToken(token);
    api.setToken(token);
    const response = await api.syncUser({ role: "CLIENT" });
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      router.push(getDashboardPath());
    } else {
      setError(
        response.message ||
          "Failed to sync user. If the database is offline, fix DATABASE_URL on Render (Supabase pooler URL)."
      );
    }
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
      await handleSyncAndRedirect(token);
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
      setToken(token);
      api.setToken(token);
      const response = await api.syncUser({
        first_name: displayName[0] || "User",
        last_name: displayName.slice(1).join(" ") || "",
        role: "CLIENT",
      });
      if (response.success && response.data) {
        setUser(response.data.user);
        router.push(getDashboardPath());
      }
    } catch (err: unknown) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-gradient flex min-h-screen min-h-[100dvh] items-center justify-center p-4 safe-top safe-bottom">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Access your SANSON Legal OS portal</CardDescription>
          <PoweredByCoreLogic className="mt-2" />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-pink-400 hover:underline">
                Forgot password?
              </Link>
            </div>
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

          <p className="mt-6 text-center text-sm text-zinc-400">
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
