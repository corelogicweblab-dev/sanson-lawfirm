"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  EmptyState,
  Badge,
} from "@sanson/ui";
import { LawyerCenterPage } from "@/components/lawyer/lawyer-center-page";
import { api } from "@/lib/api";
import type { Appointment } from "@sanson/types";

export default function LawyerAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);

  useEffect(() => {
    api.listAppointments().then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  }, []);

  const pending = items.filter((a) => a.status === "PENDING");

  return (
    <LawyerCenterPage
      title="Appointment center"
      breadcrumb="Appointments"
      description="AI intake → client wants to proceed → appointment request → lawyer review → approved."
      features={[
        "Pending requests",
        "Upcoming and completed appointments",
        "Cancelled and rescheduled tracking",
      ]}
    >
      {items.length === 0 ? (
        <EmptyState title="No appointments" description="Client appointment requests appear here." />
      ) : (
        <div className="sanson-panel overflow-x-auto">
          <p className="border-b border-white/10 px-4 py-2 text-xs text-zinc-400">
            {pending.length} pending lawyer review
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.id.slice(0, 8)}…</TableCell>
                  <TableCell>
                    <Badge>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {a.appointment_date} {a.appointment_time}
                  </TableCell>
                  <TableCell>{a.consultation_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </LawyerCenterPage>
  );
}
