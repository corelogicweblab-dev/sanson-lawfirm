"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AdvancedSearchPanel } from "@/components/search/advanced-search-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageContainer, SectionHeader } from "@sanson/ui";

export default function LawyerSearchPage() {
  return (
    <AuthGuard allowedRoles={["LAWYER", "PARALEGAL", "ADMIN"]}>
      <DashboardShell
        title="Smart Search"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/lawyer" },
          { label: "Search" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Legal Intelligence Search"
            description="Search naturally across cases, documents, evidence, and internal knowledge."
          />
          <AdvancedSearchPanel />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
