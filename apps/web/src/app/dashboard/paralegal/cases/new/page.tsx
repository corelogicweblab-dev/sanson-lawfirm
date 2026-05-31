"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer, SectionHeader } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { MasterCaseIntakeForm } from "@/components/cases/master-case-intake-form";

function NewCaseContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");

  return (
    <PageContainer>
      <SectionHeader
        title="Create new case"
        description="Master enterprise intake — create client + case in one step. Case number auto-generated."
      />
      <MasterCaseIntakeForm requestId={requestId} />
    </PageContainer>
  );
}

export default function ParalegalNewCasePage() {
  return (
    <AuthGuard allowedRoles={["PARALEGAL"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Operations", href: "/dashboard/paralegal" },
          { label: "Cases", href: "/dashboard/paralegal/cases" },
          { label: "New case" },
        ]}
      >
        <Suspense fallback={<p className="p-6 text-zinc-400">Loading form…</p>}>
          <NewCaseContent />
        </Suspense>
      </DashboardShell>
    </AuthGuard>
  );
}
