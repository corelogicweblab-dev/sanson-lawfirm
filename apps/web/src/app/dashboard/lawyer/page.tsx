"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Briefcase, AlertTriangle, ListTodo } from "lucide-react";
import { PageContainer, SectionHeader, StatCard } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { Appointment, CaseItem, TaskItem } from "@sanson/types";

export default function LawyerDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    (async () => {
      const [a, c, t] = await Promise.all([api.listAppointments(), api.listCases(), api.listTasks()]);
      if (a.success && a.data) setAppointments(a.data);
      if (c.success && c.data) setCases(c.data);
      if (t.success && t.data) setTasks(t.data);
    })();
  }, []);

  return (
    <AuthGuard allowedRoles={["LAWYER"]}>
      <DashboardShell title="Lawyer Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
        <PageContainer>
          <SectionHeader title="Consultation & Case Operations" description="Manage consultations and active legal matters" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Pending Consultations" value={appointments.filter((x)=>["PENDING","CONFIRMED"].includes(x.status)).length} icon={<CalendarDays className="h-5 w-5" />} />
            <StatCard title="Assigned Cases" value={cases.length} icon={<Briefcase className="h-5 w-5" />} />
            <StatCard title="Urgent Cases" value={cases.filter((x)=>x.priority==="URGENT").length} icon={<AlertTriangle className="h-5 w-5" />} />
            <StatCard title="Pending Tasks" value={tasks.filter((x)=>["PENDING","IN_PROGRESS"].includes(x.status)).length} icon={<ListTodo className="h-5 w-5" />} />
          </div>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}

