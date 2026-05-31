"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import { Card, CardContent, PageContainer, SectionHeader, StatCard } from "@sanson/ui";

export default function OperationsPage() {
  const [ops, setOps] = useState<Record<string, unknown>>({});

  useEffect(() => {
    api.getOpsDashboard().then((r) => {
      if (r.success && r.data) setOps(r.data as Record<string, unknown>);
    });
  }, []);

  const health = (ops.health || {}) as Record<string, unknown>;
  const alerts = (ops.alerts || {}) as Record<string, number>;
  const perf = (ops.performance || {}) as Record<string, unknown>;

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        title="Operations Center"
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Operations" }]}
      >
        <PageContainer>
          <SectionHeader
            title="Production Operations"
            description="Unified monitoring: API, AI, search, storage, and alerts."
          />
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Environment" value={String(ops.environment ?? "—")} />
            <StatCard title="Database" value={String(health.database ?? "—")} />
            <StatCard title="Open Alerts" value={alerts.open ?? 0} />
            <StatCard title="Critical Alerts" value={alerts.critical ?? 0} />
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="API Latency"
              value={`${(perf.avg_latency_ms as number) ?? 0} ms`}
            />
            <StatCard
              title="Within SLO"
              value={perf.api_within_target ? "Yes" : "Review"}
            />
            <StatCard
              title="Searches"
              value={((ops.search_metrics as Record<string, number>)?.total_searches) ?? 0}
            />
            <StatCard title="R2 Storage" value={health.r2_configured ? "On" : "Off"} />
          </div>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-white">Operations hubs</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {[
                  ["/dashboard/admin/system-health", "System Health"],
                  ["/dashboard/admin/deployment", "Deployment"],
                  ["/dashboard/admin/audit-logs", "Audit Center"],
                  ["/dashboard/admin/security", "Security"],
                  ["/dashboard/admin/ai-operations", "AI Operations"],
                  ["/dashboard/admin/control-center", "Control Center"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-pink-400 hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
