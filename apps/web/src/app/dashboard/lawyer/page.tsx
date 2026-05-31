"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, Briefcase, ListTodo, FileText } from "lucide-react";
import { PageContainer, SectionHeader, StatCard, Button } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { InstallAppPrompt } from "@/components/layout/install-app-prompt";
import { api } from "@/lib/api";
import type { CaseItem, TaskItem } from "@sanson/types";

export default function LawyerDashboardPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    (async () => {
      const [c, t] = await Promise.all([api.listCases(), api.listTasks()]);
      if (c.success && c.data) setCases(c.data);
      if (t.success && t.data) setTasks(t.data);
    })();
  }, []);

  const pendingReview = cases.filter((c) =>
    ["UNDER_REVIEW", "OPEN", "WAITING_DOCUMENTS"].includes(c.status?.name ?? "")
  );

  return (
    <AuthGuard allowedRoles={["LAWYER"]}>
      <DashboardShell title="Lawyer Dashboard" breadcrumbs={[{ label: "Legal Review" }]}>
        <PageContainer>
          <SectionHeader
            title="Legal Review & Decisions"
            description="Lawyers focus on review, strategy, approvals, and closure. Paralegals manage cases and files."
          />

          <div className="mb-8">
            <InstallAppPrompt />
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <Link href="/dashboard/lawyer/approvals">
              <Button className="h-auto w-full flex-col gap-2 py-4">
                <Scale className="h-5 w-5" />
                Approvals queue
              </Button>
            </Link>
            <Link href="/dashboard/lawyer/cases">
              <Button className="h-auto w-full flex-col gap-2 py-4" variant="outline">
                <Briefcase className="h-5 w-5" />
                My cases
              </Button>
            </Link>
            <Link href="/dashboard/lawyer/documents">
              <Button className="h-auto w-full flex-col gap-2 py-4" variant="outline">
                <FileText className="h-5 w-5" />
                Review documents
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Awaiting approval" value={pendingReview.length} icon={<Scale className="h-5 w-5" />} />
            <StatCard title="Assigned cases" value={cases.length} icon={<Briefcase className="h-5 w-5" />} />
            <StatCard title="Review tasks" value={tasks.length} icon={<ListTodo className="h-5 w-5" />} />
          </div>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
