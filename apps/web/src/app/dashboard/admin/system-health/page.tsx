"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import { Card, CardContent, PageContainer, SectionHeader, StatCard } from "@sanson/ui";

interface SystemHealth {
  uptime?: string;
  database?: string;
  openai_configured?: boolean;
  qdrant_configured?: boolean;
  r2_configured?: boolean;
  firebase_configured?: boolean;
  request_metrics?: { total_samples: number; error_count: number; avg_latency_ms: number };
  ai_usage?: { total_calls: number; tokens_input: number; tokens_output: number };
  realtime?: { supabase_configured: boolean };
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth>({});

  useEffect(() => {
    api.getSystemHealth().then((r) => {
      if (r.success && r.data) setHealth(r.data as SystemHealth);
    });
  }, []);

  const metrics = health.request_metrics;
  const ai = health.ai_usage;

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        title="System Health"
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "System Health" }]}
      >
        <PageContainer>
          <SectionHeader
            title="Platform Observability"
            description="API health, integrations, latency, and AI usage at a glance."
          />
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Status" value={health.uptime ?? "—"} />
            <StatCard title="Database" value={health.database ?? "—"} />
            <StatCard title="Avg Latency" value={`${metrics?.avg_latency_ms ?? 0} ms`} />
            <StatCard title="API Errors" value={metrics?.error_count ?? 0} />
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="OpenAI" value={health.openai_configured ? "On" : "Off"} />
            <StatCard title="Qdrant" value={health.qdrant_configured ? "On" : "Off"} />
            <StatCard title="R2 Storage" value={health.r2_configured ? "On" : "Off"} />
            <StatCard title="Realtime" value={health.realtime?.supabase_configured ? "On" : "Off"} />
          </div>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-white">AI Usage</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex justify-between">
                  <span>Total calls</span>
                  <span className="text-pink-400">{ai?.total_calls ?? 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>Tokens in</span>
                  <span className="text-pink-400">{ai?.tokens_input ?? 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>Tokens out</span>
                  <span className="text-pink-400">{ai?.tokens_output ?? 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>Request samples</span>
                  <span className="text-pink-400">{metrics?.total_samples ?? 0}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
