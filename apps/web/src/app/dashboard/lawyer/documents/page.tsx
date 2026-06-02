"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { CaseDocumentWorkspace } from "@/components/documents/case-document-workspace";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageContainer, SectionHeader } from "@sanson/ui";

export default function LawyerDocumentsPage() {
  return (
    <AuthGuard allowedRoles={["LAWYER", "ADMIN"]}>
      <DashboardShell
        title="Document Review"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/lawyer" },
          { label: "Documents" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Document Center"
            description="Select a case to review its files. Paralegals upload and organize documents per case."
          />
          <CaseDocumentWorkspace readOnly allowPrint />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
