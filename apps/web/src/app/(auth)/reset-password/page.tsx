"use client";

import Link from "next/link";
import { Scale, CheckCircle } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@sanson/ui";

export default function ResetPasswordPage() {
  return (
    <div className="auth-gradient flex flex-1 items-center justify-center p-4 py-8 safe-bottom">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Complete your password reset</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
          <p className="text-sm text-zinc-300">
            Password reset is handled through Firebase Authentication. Click the link in your
            email to set a new password, then return here to sign in.
          </p>
          <Link href="/login">
            <Button className="w-full">Go to Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
