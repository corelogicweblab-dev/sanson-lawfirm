"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { Scale, ArrowLeft } from "lucide-react";
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
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-gradient flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>We&apos;ll send you a reset link</CardDescription>
          <PoweredByCoreLogic className="mt-2" />
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-zinc-300">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              </p>
              <Link href="/login">
                <Button variant="secondary" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-1 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
