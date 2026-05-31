"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer, SectionHeader, Card, CardContent } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { MasterCaseIntakeForm } from "@/components/cases/master-case-intake-form";

function NewCaseContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const source = searchParams.get("source");

  return (
    <PageContainer>
      <Card className="sanson-panel mb-6 border-pink-500/30 shadow-[var(--glow-pink)]">
        <CardContent className="p-5 sm:p-6">
          <SectionHeader
            title="Create draft case"
            description="Master enterprise intake — manual encoding for walk-in, phone, referral, or AI requests. Create client + case in one step; case number auto-generated."
          />
        </CardContent>
      </Card>
      <MasterCaseIntakeForm requestId={requestId} defaultSourceType={source} />
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
        <Suspense fallback={<p className="p-6 text-zinc-200">Loading master intake…</p>}>
          <NewCaseContent />
        </Suspense>
      </DashboardShell>
    </AuthGuard>
  );
}
