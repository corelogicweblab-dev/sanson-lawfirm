"use client";

import { PageContainer, SectionHeader } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { InstallAppPrompt } from "@/components/layout/install-app-prompt";
import { LawyerCommandCenter } from "@/components/lawyer/lawyer-command-center";

export default function LawyerDashboardPage() {
  return (
    <AuthGuard allowedRoles={["LAWYER"]}>
      <DashboardShell
        title="Lawyer Dashboard"
        breadcrumbs={[{ label: "Lawyer dashboard" }]}
      >
        <PageContainer className="sanson-dashboard-hero">
          <SectionHeader
            title="Lawyer Dashboard"
            description="Legal decision maker — review, approve, strategize, and represent. Paralegals build the case file."
          />
          <div className="mb-8">
            <InstallAppPrompt />
          </div>
          <LawyerCommandCenter />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
