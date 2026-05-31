"use client";

import { useEffect, useState } from "react";
import { FilePlus2, CalendarDays, Briefcase } from "lucide-react";
import {
  PageContainer,
  SectionHeader,
  StatCard,
  Card,
  CardContent,
  CardTitle,
  EmptyState,
} from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { Appointment, CaseItem, LegalRequest } from "@sanson/types";

export default function ClientDashboardPage() {
  const [requests, setRequests] = useState<LegalRequest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);

  useEffect(() => {
    (async () => {
      const [r, a, c] = await Promise.all([
        api.listMyRequests(),
        api.listAppointments(),
        api.listCases(),
      ]);
      if (r.success && r.data) setRequests(r.data);
      if (a.success && a.data) setAppointments(a.data);
      if (c.success && c.data) setCases(c.data);
    })();
  }, []);

  return (
    <AuthGuard allowedRoles={["CLIENT"]}>
      <DashboardShell title="Client Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
        <PageContainer>
          <SectionHeader
            title="My Legal Journey"
            description="Track your representation requests and case progress"
          />
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <StatCard title="My Requests" value={requests.length} icon={<FilePlus2 className="h-5 w-5" />} />
            <StatCard
              title="Upcoming Appointments"
              value={appointments.filter((x) => ["PENDING", "CONFIRMED"].includes(x.status)).length}
              icon={<CalendarDays className="h-5 w-5" />}
            />
            <StatCard
              title="Active Cases"
              value={cases.filter((x) => x.status && !x.status.is_terminal).length}
              icon={<Briefcase className="h-5 w-5" />}
            />
          </div>
          <Card>
            <CardContent className="p-6">
              <CardTitle className="mb-3 text-base">Recent Requests</CardTitle>
              {requests.length === 0 ? (
                <EmptyState title="No requests yet" description="Start by submitting a representation request." />
              ) : (
                <ul className="space-y-2">
                  {requests.slice(0, 5).map((r) => (
                    <li key={r.id} className="rounded-lg bg-white/[0.02] px-3 py-2 text-sm">
                      <span className="text-zinc-300">{r.request_reference} - {r.subject}</span>
                      <span className="ml-2 text-pink-400">{r.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}


