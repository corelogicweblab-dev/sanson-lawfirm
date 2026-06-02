"use client";

import { useEffect } from "react";
import { LoadingPage } from "@sanson/ui";
import { hardNavigate, navigateToLogin } from "@/lib/static-navigation";
import { useAuthStore } from "@/store/auth";
import type { UserRole } from "@sanson/types";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, getRole, getDashboardPath } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    if (allowedRoles) {
      const role = getRole();
      if (role && !allowedRoles.includes(role)) {
        hardNavigate(getDashboardPath());
      }
    }
  }, [isAuthenticated, isLoading, allowedRoles, getRole, getDashboardPath]);

  if (isLoading) {
    return <LoadingPage text="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <LoadingPage text="Redirecting..." />;
  }

  return <>{children}</>;
}
