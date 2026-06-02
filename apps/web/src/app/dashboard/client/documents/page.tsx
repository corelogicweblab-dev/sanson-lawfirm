"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { CaseDocumentWorkspace } from "@/components/documents/case-document-workspace";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageContainer, SectionHeader } from "@sanson/ui";

export default function ClientDocumentsPage() {
  return (
    <AuthGuard allowedRoles={["CLIENT"]}>
      <DashboardShell
        title="Document Center"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/client" },
          { label: "Documents" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Upload Center"
            description="Select your legal matter, then upload evidence and supporting documents for that case only."
          />
          <CaseDocumentWorkspace allowPrint={false} />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
