"use client";

import { useEffect, useState } from "react";
import { ClipboardList, CalendarDays, Briefcase, PieChart } from "lucide-react";
import { PageContainer, SectionHeader, StatCard, Card, CardContent, CardTitle, EmptyState } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { WorkflowStats } from "@sanson/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<WorkflowStats | null>(null);

  useEffect(() => {
    (async () => {
      const res = await api.getWorkflowStats();
      if (res.success && res.data) setStats(res.data);
    })();
  }, []);

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell title="Admin Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
        <PageContainer>
          <SectionHeader title="Phase 2 Operations Overview" description="Monitor legal request and case workflow health" />
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Requests" value={stats?.total_requests ?? 0} icon={<ClipboardList className="h-5 w-5" />} />
            <StatCard title="Consultations Scheduled" value={stats?.consultations_scheduled ?? 0} icon={<CalendarDays className="h-5 w-5" />} />
            <StatCard title="Active Cases" value={stats?.active_cases ?? 0} icon={<Briefcase className="h-5 w-5" />} />
            <StatCard title="Pending Tasks" value={stats?.pending_tasks ?? 0} icon={<PieChart className="h-5 w-5" />} />
          </div>
          <Card>
            <CardContent className="p-6">
              <CardTitle className="mb-3 text-base">Case Status Distribution</CardTitle>
              {!stats || Object.keys(stats.case_status_distribution).length===0 ? (
                <EmptyState title="No cases yet" description="Case status distribution will populate once cases are opened." />
              ) : (
                <ul className="space-y-2">{Object.entries(stats.case_status_distribution).map(([k,v])=><li key={k} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"><span>{k}</span><span className="text-pink-400">{v}</span></li>)}</ul>
              )}
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}

