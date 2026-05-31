"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ListTodo,
  FileText,
  Briefcase,
  FolderInput,
  FileUp,
  ClipboardList,
  CalendarDays,
  FolderPlus,
} from "lucide-react";
import { PARALEGAL_FILE_TYPES } from "@sanson/shared";
import { PageContainer, SectionHeader, StatCard, Button } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ParalegalWorkflowStrip } from "@/components/operations/paralegal-workflow-strip";
import { InstallAppPrompt } from "@/components/layout/install-app-prompt";
import { api } from "@/lib/api";
import type { CaseItem, TaskItem } from "@sanson/types";

export default function ParalegalDashboardPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [intakeCount, setIntakeCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [c, t, d, req] = await Promise.all([
        api.listCases(),
        api.listTasks(),
        api.listDocuments(),
        api.listMyRequests(),
      ]);
      if (c.success && c.data) setCases(c.data);
      if (t.success && t.data) setTasks(t.data);
      if (d.success && d.data) setDocCount(d.data.length);
      if (req.success && req.data) setIntakeCount(req.data.length);
    })();
  }, []);

  return (
    <AuthGuard allowedRoles={["PARALEGAL"]}>
      <DashboardShell title="Paralegal Dashboard" breadcrumbs={[{ label: "Legal Operations" }]}>
        <PageContainer>
          <SectionHeader
            title="Paralegal Operations Center"
            description="Primary operator of SANSON Legal OS — cases, files, calendar, intake, and legacy migration."
          />

          <ParalegalWorkflowStrip className="mb-8" />

          <div className="mb-8">
            <InstallAppPrompt />
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/paralegal/intake">
              <Button className="h-auto w-full flex-col gap-2 py-4" variant="default">
                <ClipboardList className="h-5 w-5" />
                Intake queue
              </Button>
            </Link>
            <Link href="/dashboard/paralegal/cases/new">
              <Button className="h-auto w-full flex-col gap-2 py-4" variant="outline">
                <FolderPlus className="h-5 w-5" />
                New draft case
              </Button>
            </Link>
            <Link href="/dashboard/paralegal/documents">
              <Button className="h-auto w-full flex-col gap-2 py-4" variant="outline">
                <FileUp className="h-5 w-5" />
                Upload documents
              </Button>
            </Link>
            <Link href="/dashboard/paralegal/calendar">
              <Button className="h-auto w-full flex-col gap-2 py-4" variant="outline">
                <CalendarDays className="h-5 w-5" />
                Calendar
              </Button>
            </Link>
            <Link href="/dashboard/paralegal/migration-center">
              <Button className="h-auto w-full flex-col gap-2 py-4" variant="outline">
                <FolderInput className="h-5 w-5" />
                Legacy migration
              </Button>
            </Link>
            <Link href="/dashboard/paralegal/cases">
              <Button className="h-auto w-full flex-col gap-2 py-4" variant="outline">
                <Briefcase className="h-5 w-5" />
                All cases
              </Button>
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <StatCard title="Intake requests" value={intakeCount} icon={<ClipboardList className="h-5 w-5" />} />
            <StatCard title="Cases in repository" value={cases.length} icon={<Briefcase className="h-5 w-5" />} />
            <StatCard title="Documents" value={docCount} icon={<FileText className="h-5 w-5" />} />
            <StatCard title="Tasks" value={tasks.length} icon={<ListTodo className="h-5 w-5" />} />
          </div>

          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-pink-300/80">
            File types you manage
          </p>
          <div className="flex flex-wrap gap-2">
            {PARALEGAL_FILE_TYPES.map((t) => (
              <span
                key={t}
                className="rounded-full border border-pink-500/25 bg-pink-950/30 px-3 py-1 text-xs text-zinc-300"
              >
                {t}
              </span>
            ))}
          </div>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
