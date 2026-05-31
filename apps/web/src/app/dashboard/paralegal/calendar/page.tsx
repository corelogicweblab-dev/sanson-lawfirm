"use client";

import { useEffect, useState } from "react";
import {
  PageContainer,
  SectionHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  EmptyState,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
} from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { Appointment, LegalRequest } from "@sanson/types";

export default function ParalegalCalendarPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [requests, setRequests] = useState<LegalRequest[]>([]);
  const [lawyers, setLawyers] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    request_id: "",
    lawyer_id: "",
    appointment_date: "",
    appointment_time: "09:00",
    consultation_type: "ONLINE",
    remarks: "",
  });

  const load = () => {
    api.listAppointments().then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  };

  useEffect(() => {
    load();
    api.listMyRequests().then((r) => {
      if (r.success && r.data) setRequests(r.data);
    });
    api.listUserDirectory("LAWYER").then((r) => {
      if (r.success && r.data) setLawyers(r.data);
    });
  }, []);

  return (
    <AuthGuard allowedRoles={["PARALEGAL"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/paralegal" },
          { label: "Calendar" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Calendar & Scheduling"
            description="Paralegals schedule hearings, meetings, consultations, deadlines, and follow-ups. Assigned lawyers receive calendar entries."
          />

          <Button className="mb-4" onClick={() => setShowForm(!showForm)}>
            Schedule appointment
          </Button>

          {showForm && (
            <Card className="mb-6 sanson-panel">
              <CardContent className="space-y-3 p-4">
                <label className="block text-sm text-zinc-400">
                  Legal request
                  <select
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                    value={form.request_id}
                    onChange={(e) => setForm({ ...form, request_id: e.target.value })}
                  >
                    <option value="">Select request</option>
                    {requests.map((req) => (
                      <option key={req.id} value={req.id}>
                        {req.request_reference} — {req.subject}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-zinc-400">
                  Lawyer
                  <select
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                    value={form.lawyer_id}
                    onChange={(e) => setForm({ ...form, lawyer_id: e.target.value })}
                  >
                    <option value="">Optional assign now</option>
                    {lawyers.map((l) => (
                      <option key={String(l.id)} value={String(l.id)}>
                        {String(l.display_name)}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  label="Date"
                  type="date"
                  value={form.appointment_date}
                  onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                />
                <Input
                  label="Time"
                  type="time"
                  value={form.appointment_time}
                  onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                />
                <Button
                  onClick={async () => {
                    const r = await api.createAppointment({
                      ...form,
                      lawyer_id: form.lawyer_id || undefined,
                    });
                    if (r.success) {
                      setShowForm(false);
                      load();
                    }
                  }}
                >
                  Save to calendar
                </Button>
              </CardContent>
            </Card>
          )}

          {items.length === 0 ? (
            <EmptyState title="No scheduled events" description="Create hearings, meetings, or consultations above." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.appointment_date}</TableCell>
                    <TableCell>{a.appointment_time}</TableCell>
                    <TableCell>{a.consultation_type}</TableCell>
                    <TableCell>
                      <Badge>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
