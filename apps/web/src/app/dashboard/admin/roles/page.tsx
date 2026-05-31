"use client";

import { PageContainer, SectionHeader, EmptyState } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AdminRolesPage() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/admin" },
          { label: "Roles" },
        ]}
      >
        <PageContainer>
          <SectionHeader title="Role Management" description="Roles and permission matrix" />
          <EmptyState
            title="Permission matrix"
            description="View role permissions via GET /api/v1/roles/matrix"
          />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}

