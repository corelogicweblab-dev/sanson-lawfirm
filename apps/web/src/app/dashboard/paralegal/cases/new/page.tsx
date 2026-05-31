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
  const source = searchParams.get("source");

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-start gap-3">
        <span className="rounded-full border border-pink-400/40 bg-pink-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-pink-100">
          Master Enterprise Intake
        </span>
        <span className="text-xs text-pink-200/80">7 sections · auto SLF case number</span>
      </div>
      <SectionHeader
        title="Create draft case"
        description="Full legal operations intake: new or existing client, opposing party, case details, team, dates — not the old 2-field form."
      />
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
        <Suspense fallback={<p className="p-6 text-pink-100">Loading master intake…</p>}>
          <NewCaseContent />
        </Suspense>
      </DashboardShell>
    </AuthGuard>
  );
}
