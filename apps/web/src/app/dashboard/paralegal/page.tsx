"use client";

import { useEffect, useState } from "react";
import { ListTodo, FileClock, Briefcase } from "lucide-react";
import { PageContainer, SectionHeader, StatCard } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { CaseItem, TaskItem } from "@sanson/types";

export default function ParalegalDashboardPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    (async () => {
      const [c, t] = await Promise.all([api.listCases(), api.listTasks()]);
      if (c.success && c.data) setCases(c.data);
      if (t.success && t.data) setTasks(t.data);
    })();
  }, []);

  return (
    <AuthGuard allowedRoles={["PARALEGAL"]}>
      <DashboardShell title="Paralegal Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
        <PageContainer>
          <SectionHeader title="Case Coordination" description="Support case preparation and coordination" />
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Assigned Tasks" value={tasks.length} icon={<ListTodo className="h-5 w-5" />} />
            <StatCard title="Pending Documents" value={0} icon={<FileClock className="h-5 w-5" />} description="Placeholder for Phase 3 docs" />
            <StatCard title="Preparation Queue" value={cases.length} icon={<Briefcase className="h-5 w-5" />} />
          </div>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}

