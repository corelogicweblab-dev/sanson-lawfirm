"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { ParalegalWorkflowStrip } from "@/components/operations/paralegal-workflow-strip";
import { api } from "@/lib/api";
import type { LegalRequest } from "@sanson/types";

export default function ParalegalIntakePage() {
  const [items, setItems] = useState<LegalRequest[]>([]);
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    case_category: "CIVIL",
    subject: "",
    description: "",
    priority: "MEDIUM",
  });
  const [message, setMessage] = useState("");

  const load = () => {
    api.listMyRequests().then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  };

  useEffect(() => {
    load();
    api.listUserDirectory("CLIENT").then((r) => {
      if (r.success && r.data) setClients(r.data);
    });
  }, []);

  return (
    <AuthGuard allowedRoles={["PARALEGAL"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/paralegal" },
          { label: "Intake Queue" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Intake Queue"
            description="Review AI intake, walk-ins, phone, and referrals — paralegal creates and routes requests."
          />
          <ParalegalWorkflowStrip className="mb-6" />

          <div className="mb-4 flex flex-wrap gap-2">
            <Button onClick={() => setShowForm(!showForm)}>Manual intake (walk-in / phone)</Button>
            <Link href="/dashboard/paralegal/cases/new">
              <Button variant="outline">Create draft case</Button>
            </Link>
          </div>

          {showForm && (
            <Card className="mb-6 sanson-panel">
              <CardContent className="space-y-3 p-4">
                <label className="block text-sm text-zinc-400">
                  Client
                  <select
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
                    value={form.client_id}
                    onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  >
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={String(c.id)} value={String(c.id)}>
                        {String(c.display_name)} ({String(c.email)})
                      </option>
                    ))}
                  </select>
                </label>
                <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                <textarea
                  className="w-full rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white"
                  placeholder="Description (min 10 characters)"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <Button
                  onClick={async () => {
                    const r = await api.createIntakeRequest(form);
                    if (!r.success) {
                      setMessage(r.message || "Failed");
                      return;
                    }
                    setMessage("Intake recorded.");
                    setShowForm(false);
                    load();
                  }}
                >
                  Submit intake
                </Button>
              </CardContent>
            </Card>
          )}
          {message && <p className="mb-4 text-sm text-emerald-300">{message}</p>}

          {items.length === 0 ? (
            <EmptyState title="No intake requests" description="Client AI requests and manual intake appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.request_reference}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>
                      <Badge>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/paralegal/cases/new?requestId=${r.id}`}>
                        <span className="text-sm text-pink-400 hover:underline">Create draft case →</span>
                      </Link>
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
