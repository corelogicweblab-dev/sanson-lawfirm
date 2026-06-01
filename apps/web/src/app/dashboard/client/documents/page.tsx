"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DocumentCenter } from "@/components/documents/document-center";
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
            description="Securely upload evidence and supporting documents for your legal matter."
          />
          <DocumentCenter allowPrint={false} />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
