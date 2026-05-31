"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingPage } from "@sanson/ui";
import { useAuthStore } from "@/store/auth";
import type { UserRole } from "@sanson/types";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, getRole, getDashboardPath } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (allowedRoles) {
      const role = getRole();
      if (role && !allowedRoles.includes(role)) {
        router.replace(getDashboardPath());
      }
    }
  }, [isAuthenticated, isLoading, allowedRoles, router, getRole, getDashboardPath]);

  if (isLoading) {
    return <LoadingPage text="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <LoadingPage text="Redirecting..." />;
  }

  return <>{children}</>;
}
