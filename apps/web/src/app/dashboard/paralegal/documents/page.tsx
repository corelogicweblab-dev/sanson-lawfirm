"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DocumentCenter, TimelineViewer } from "@/components/documents/document-center";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, PageContainer, SectionHeader } from "@sanson/ui";

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
            description="Validate uploads, organize evidence, and review AI timelines."
          />
          <DocumentCenter showProcess />
          <Card className="mt-8 border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 font-semibold text-white">Timeline Review</h3>
            <TimelineViewer />
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
