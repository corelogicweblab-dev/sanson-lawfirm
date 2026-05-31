"use client";

import { PageContainer, SectionHeader, EmptyState } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AdminUsersPage() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/admin" },
          { label: "Users" },
        ]}
      >
        <PageContainer>
          <SectionHeader title="User Management" description="Manage all platform users" />
          <EmptyState
            title="User management table"
            description="Full user management UI will be enhanced in Phase 2. Use the API at GET /api/v1/users."
          />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}

