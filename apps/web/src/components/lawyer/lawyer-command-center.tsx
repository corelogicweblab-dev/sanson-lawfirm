"use client";

import { useEffect, useState } from "react";
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
  Loader2,
} from "lucide-react";
import { StatCard, Button, Badge } from "@sanson/ui";
import type { CaseItem, LawyerDashboardStats } from "@sanson/types";
import { api } from "@/lib/api";
import { CaseIntelligenceCard } from "./case-intelligence-card";
import { LawyerWorkflowStrip } from "./lawyer-workflow-strip";

const EMPTY_STATS: LawyerDashboardStats = {
  active_cases: 0,
  pending_review: 0,
  urgent_high: 0,
  pending_approvals: 0,
  open_tasks: 0,
  overdue_tasks: 0,
  appointments_pending: 0,
  todays_consultations: 0,
  documents_total: 0,
  documents_pending_review: 0,
  evidence_total: 0,
  evidence_pending_validation: 0,
  pending_requests: 0,
  ai_analyses_today: 0,
  notifications_unread: 0,
};

export function LawyerCommandCenter() {
  const [stats, setStats] = useState<LawyerDashboardStats>(EMPTY_STATS);
  const [previewCases, setPreviewCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const dash = await api.getLawyerDashboard();
        if (cancelled) return;

        if (!dash.success || !dash.data) {
          setError(dash.message || "Could not load lawyer dashboard from API.");
          return;
        }

        setStats(dash.data.stats);
        setPreviewCases(dash.data.preview_cases ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const workQueue = [
    {
      label: "Cases awaiting review",
      count: stats.pending_review,
      href: "/dashboard/lawyer/approvals",
      icon: Scale,
    },
    {
      label: "Cases awaiting approval",
      count: stats.pending_approvals,
      href: "/dashboard/lawyer/approvals",
      icon: CheckCircle2,
    },
    {
      label: "Urgent matters",
      count: stats.urgent_high,
      href: "/dashboard/lawyer/cases?filter=URGENT",
      icon: AlertCircle,
    },
    {
      label: "Documents pending review",
      count: stats.documents_pending_review,
      href: "/dashboard/lawyer/documents",
      icon: FileText,
    },
    {
      label: "Evidence pending validation",
      count: stats.evidence_pending_validation,
      href: "/dashboard/lawyer/evidence",
      icon: Shield,
    },
    {
      label: "Appointment requests",
      count: stats.appointments_pending,
      href: "/dashboard/lawyer/appointments",
      icon: CalendarDays,
    },
    {
      label: "Overdue tasks",
      count: stats.overdue_tasks,
      href: "/dashboard/lawyer/tasks",
      icon: ListTodo,
    },
    {
      label: "Intake / proceed requests",
      count: stats.pending_requests,
      href: "/dashboard/lawyer/requests",
      icon: Users,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading firm metrics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="sanson-panel space-y-3 p-6 text-sm">
        <p className="font-medium text-rose-200">Dashboard could not load</p>
        <p className="text-rose-300">{error}</p>
        <p className="text-zinc-400">
          The live API runs on Render and may need 30–60 seconds to wake after idle time. This is not
          a broken app — tap Retry once or twice. If it keeps failing, sign out and sign in again.
        </p>
        <Button size="sm" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LawyerWorkflowStrip />

      <div className="sanson-metrics-grid">
        <StatCard staggerIndex={0} title="Active cases" value={stats.active_cases} icon={<Briefcase className="h-5 w-5" />} />
        <StatCard staggerIndex={1} title="Pending review" value={stats.pending_review} icon={<Scale className="h-5 w-5" />} />
        <StatCard staggerIndex={2} title="Urgent / high" value={stats.urgent_high} icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard staggerIndex={3} title="Pending approvals" value={stats.pending_approvals} icon={<Gavel className="h-5 w-5" />} />
        <StatCard staggerIndex={4} title="Appointments pending" value={stats.appointments_pending} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard staggerIndex={5} title="Documents in system" value={stats.documents_total} icon={<FileText className="h-5 w-5" />} />
        <StatCard staggerIndex={6} title="Evidence items system" value={stats.evidence_total} icon={<Shield className="h-5 w-5" />} />
        <StatCard
          staggerIndex={7}
          title="AI analyses today"
          value={stats.ai_analyses_today}
          icon={<Sparkles className="h-5 w-5" />}
          description={`Notifications · ${stats.notifications_unread} unread`}
        />
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
        {previewCases.length === 0 ? (
          <p className="sanson-panel p-4 text-sm text-zinc-400">
            No cases awaiting lawyer review. Paralegals prepare matters; you approve and set strategy.
          </p>
        ) : (
          <div className="space-y-3">
            {previewCases.map((c) => (
              <CaseIntelligenceCard key={c.id} caseItem={c} />
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
