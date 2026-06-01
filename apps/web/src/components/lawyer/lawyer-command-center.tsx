"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Scale,
  Briefcase,
  ListTodo,
  FileText,
  CalendarDays,
  Bell,
  Sparkles,
  Clock,
  Gavel,
  CheckCircle2,
  AlertCircle,
  Users,
  BookOpen,
  BarChart3,
  Shield,
} from "lucide-react";
import { StatCard, Button, Badge } from "@sanson/ui";
import {
  isCasePendingLawyerReview,
  countOverdueTasks,
} from "@sanson/shared";
import type { CaseItem, TaskItem, Appointment, DocumentItem, EvidenceItemRecord } from "@sanson/types";
import { api } from "@/lib/api";
import { CaseIntelligenceCard } from "./case-intelligence-card";
import { LawyerWorkflowStrip } from "./lawyer-workflow-strip";

export function LawyerCommandCenter() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItemRecord[]>([]);
  const [requests, setRequests] = useState(0);

  useEffect(() => {
    (async () => {
      const [c, t, a, d, e, req] = await Promise.all([
        api.listCases(),
        api.listTasks(),
        api.listAppointments(),
        api.listDocuments(),
        api.listEvidence(),
        api.listMyRequests(),
      ]);
      if (c.success && c.data) setCases(c.data);
      if (t.success && t.data) setTasks(t.data);
      if (a.success && a.data) setAppointments(a.data);
      if (d.success && d.data) setDocuments(d.data);
      if (e.success && e.data) setEvidence(e.data);
      if (req.success && req.data) setRequests(req.data.length);
    })();
  }, []);

  const pendingReview = cases.filter(isCasePendingLawyerReview);
  const activeCases = cases.filter(
    (c) => c.status?.name !== "CLOSED" && c.status?.name !== "ARCHIVED"
  );
  const urgent = cases.filter((c) => c.priority === "URGENT" || c.priority === "HIGH");
  const overdueTasks = countOverdueTasks(tasks);
  const pendingAppts = appointments.filter((a) => a.status === "PENDING").length;

  const docsByCase = useMemo(() => {
    const m: Record<string, number> = {};
    documents.forEach((d) => {
      if (d.caseId) m[d.caseId] = (m[d.caseId] ?? 0) + 1;
    });
    return m;
  }, [documents]);

  const evidenceByCase = useMemo(() => {
    const m: Record<string, number> = {};
    evidence.forEach((ev) => {
      if (ev.caseId) m[ev.caseId] = (m[ev.caseId] ?? 0) + 1;
    });
    return m;
  }, [evidence]);

  const intelligencePreview = pendingReview.slice(0, 3);

  const workQueue = [
    {
      label: "Cases awaiting review",
      count: pendingReview.length,
      href: "/dashboard/lawyer/approvals",
      icon: Scale,
    },
    {
      label: "Cases awaiting approval",
      count: pendingReview.length,
      href: "/dashboard/lawyer/approvals",
      icon: CheckCircle2,
    },
    {
      label: "Urgent matters",
      count: urgent.length,
      href: "/dashboard/lawyer/cases?filter=URGENT",
      icon: AlertCircle,
    },
    {
      label: "Documents pending review",
      count: documents.length,
      href: "/dashboard/lawyer/documents",
      icon: FileText,
    },
    {
      label: "Evidence pending validation",
      count: evidence.length,
      href: "/dashboard/lawyer/evidence",
      icon: Shield,
    },
    {
      label: "Appointment requests",
      count: pendingAppts,
      href: "/dashboard/lawyer/appointments",
      icon: CalendarDays,
    },
    {
      label: "Overdue tasks",
      count: overdueTasks,
      href: "/dashboard/lawyer/tasks",
      icon: ListTodo,
    },
    {
      label: "Intake / proceed requests",
      count: requests,
      href: "/dashboard/lawyer/requests",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <LawyerWorkflowStrip />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Active cases" value={activeCases.length} icon={<Briefcase className="h-5 w-5" />} />
        <StatCard title="Pending review" value={pendingReview.length} icon={<Scale className="h-5 w-5" />} />
        <StatCard title="Urgent / high" value={urgent.length} icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard title="Pending approvals" value={pendingReview.length} icon={<Gavel className="h-5 w-5" />} />
        <StatCard title="Open tasks" value={tasks.filter((t) => t.status !== "COMPLETED").length} icon={<ListTodo className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Appointments pending" value={pendingAppts} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard title="Documents in system" value={documents.length} icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Evidence items" value={evidence.length} icon={<Shield className="h-5 w-5" />} />
        <StatCard title="AI analyses today" value="—" icon={<Sparkles className="h-5 w-5" />} description="Open AI Center" />
        <StatCard title="Notifications" value="—" icon={<Bell className="h-5 w-5" />} description="Realtime feed" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-300">My work queue</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {workQueue.map((item) => (
            <Link key={item.label} href={item.href} className="sanson-action-tile !min-h-0 flex-row justify-between !py-3">
              <span className="flex items-center gap-2 text-left text-sm">
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </span>
              <Badge>{item.count}</Badge>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
            Case intelligence center
          </h2>
          <Link href="/dashboard/lawyer/cases">
            <Button size="sm" variant="outline">
              All cases
            </Button>
          </Link>
        </div>
        {intelligencePreview.length === 0 ? (
          <p className="sanson-panel p-4 text-sm text-zinc-400">
            No cases awaiting lawyer review. Paralegals prepare matters; you approve and set strategy.
          </p>
        ) : (
          <div className="space-y-3">
            {intelligencePreview.map((c) => (
              <CaseIntelligenceCard
                key={c.id}
                caseItem={c}
                docCount={docsByCase[c.id] ?? 0}
                evidenceCount={evidenceByCase[c.id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-300">
          Quick access
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/dashboard/lawyer/ai-center", label: "AI legal intelligence", icon: Sparkles },
            { href: "/dashboard/lawyer/calendar", label: "Legal calendar", icon: CalendarDays },
            { href: "/dashboard/lawyer/team", label: "Team collaboration", icon: Users },
            { href: "/dashboard/lawyer/knowledge", label: "Legal research", icon: BookOpen },
            { href: "/dashboard/lawyer/search", label: "Enterprise search", icon: Briefcase },
            { href: "/dashboard/lawyer/analytics", label: "Analytics", icon: BarChart3 },
            { href: "/dashboard/lawyer/notifications", label: "Notifications", icon: Bell },
            { href: "/dashboard/lawyer/reports", label: "Reports", icon: FileText },
          ].map((hub) => (
            <Link key={hub.href} href={hub.href} className="sanson-action-tile !min-h-0 !flex-row gap-2 !py-3">
              <hub.icon className="h-4 w-4 shrink-0" />
              <span className="text-sm">{hub.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="flex items-center gap-2 text-xs text-zinc-500">
        <Clock className="h-3 w-3" />
        Paralegals build cases · Lawyers control legal decisions, approvals, and strategy
      </p>
    </div>
  );
}
