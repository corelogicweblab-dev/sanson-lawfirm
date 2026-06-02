"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { CaseDocumentWorkspace } from "@/components/documents/case-document-workspace";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageContainer, SectionHeader } from "@sanson/ui";

export default function ParalegalDocumentsPage() {
  return (
    <AuthGuard allowedRoles={["PARALEGAL", "ADMIN"]}>
      <DashboardShell
        title="Document Coordination"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/paralegal" },
          { label: "Documents" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Evidence Preparation"
            description="Select a case first — every file is stored inside that case only (not a firm-wide folder)."
          />
          <CaseDocumentWorkspace showProcess showTimeline />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
