"use client";

import { PageContainer, SectionHeader } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminUserManagement } from "@/components/admin/admin-user-management";

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
          <SectionHeader
            title="User management"
            description="View, edit roles and profiles, deactivate, or remove platform users."
          />
          <AdminUserManagement />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
