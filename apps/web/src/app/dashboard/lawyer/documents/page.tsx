"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DocumentCenter } from "@/components/documents/document-center";
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
            description="Review client uploads, run OCR, and generate AI analysis."
          />
          <DocumentCenter showProcess />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
