"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import { Card, CardContent, PageContainer, SectionHeader } from "@sanson/ui";

type SecurityEvent = {
  id: string;
  eventType: string;
  severity: string;
  description: string;
  createdAt: string;
};

export default function SecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    api.listSecurityEvents().then((r) => {
      if (r.success && r.data) setEvents(r.data as SecurityEvent[]);
    });
  }, []);

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        title="Security"
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Security" }]}
      >
        <PageContainer>
          <SectionHeader
            title="Security Events"
            description="Authentication anomalies, lockouts, and platform security activity."
          />
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-0">
              <ul className="divide-y divide-white/5">
                {events.length === 0 ? (
                  <li className="p-6 text-sm text-zinc-500">No security events recorded.</li>
                ) : (
                  events.map((e) => (
                    <li key={e.id} className="flex items-start justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium text-white">{e.eventType}</p>
                        <p className="text-sm text-zinc-400">{e.description}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                          e.severity === "CRITICAL"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-white/10 text-zinc-300"
                        }`}
                      >
                        {e.severity}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
