"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { Scale } from "lucide-react";
import {
  Button,
  Input,
  PoweredByCoreLogic,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@sanson/ui";
import { inferRoleFromEmail } from "@sanson/shared";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken, getDashboardPath } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isFirebaseConfigured()) {
      setError("Firebase is not configured.");
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
      setToken(token);
      api.setToken(token);
      const response = await api.syncUser({
        first_name: firstName,
        last_name: lastName,
        role: inferRoleFromEmail(email),
      });
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        router.push(getDashboardPath());
      } else {
        setError(response.message || "Registration sync failed.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithPopup(auth, googleProvider);
      const token = await credential.user.getIdToken();
      const displayName = credential.user.displayName?.split(" ") ?? [];
      setToken(token);
      api.setToken(token);
      const userEmail = credential.user.email ?? "";
      const response = await api.syncUser({
        first_name: displayName[0] || "User",
        last_name: displayName.slice(1).join(" ") || "",
        role: inferRoleFromEmail(userEmail),
      });
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        router.push(getDashboardPath());
      } else {
        setError(response.message || "Google sign-up sync failed.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-up failed");
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
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join SANSON Legal OS — free AI consultation</CardDescription>
          <PoweredByCoreLogic className="mt-2" />
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
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button variant="secondary" className="w-full" onClick={handleGoogleRegister} loading={loading}>
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
