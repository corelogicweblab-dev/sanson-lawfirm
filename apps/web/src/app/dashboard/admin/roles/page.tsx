"use client";

import { PageContainer, SectionHeader } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminRoleAssignment } from "@/components/admin/admin-role-assignment";

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
          <SectionHeader
            title="Assign firm roles"
            description="Set whether each user is a Lawyer, Paralegal, Client, or System Administrator."
          />
          <AdminRoleAssignment />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
