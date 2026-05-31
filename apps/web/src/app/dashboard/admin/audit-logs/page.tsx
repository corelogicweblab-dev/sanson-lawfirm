"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  PageContainer,
  SectionHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sanson/ui";

type AuditRow = Record<string, unknown>;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [aiLogs, setAiLogs] = useState<AuditRow[]>([]);
  const [tab, setTab] = useState<"platform" | "ai">("platform");

  useEffect(() => {
    api.listAuditLogs(1, 50).then((r) => {
      if (r.success && r.data) setLogs(r.data as AuditRow[]);
    });
    api.listAiAuditLogs(1, 50).then((r) => {
      if (r.success && r.data) setAiLogs(r.data as AuditRow[]);
    });
  }, []);

  const rows = tab === "platform" ? logs : aiLogs;

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Audit Logs" }]}
      >
        <PageContainer>
          <SectionHeader
            title="Audit Intelligence"
            description="Authentication, case access, document changes, and AI interactions."
          />
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("platform")}
              className={`rounded-lg px-3 py-2 text-sm sm:px-4 ${tab === "platform" ? "bg-pink-600 text-white" : "bg-white/5 text-zinc-400"}`}
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => setTab("ai")}
              className={`rounded-lg px-3 py-2 text-sm sm:px-4 ${tab === "ai" ? "bg-pink-600 text-white" : "bg-white/5 text-zinc-400"}`}
            >
              AI Audit
            </button>
          </div>
          <Card className="sanson-panel">
            <CardContent className="p-0 sm:p-0">
              {rows.length === 0 ? (
                <p className="p-6 text-sm text-zinc-500">
                  No audit entries yet. Run migrations 013–016 on Supabase.
                </p>
              ) : tab === "platform" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead className="hidden sm:table-cell">IP</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={String(row.id)}>
                        <TableCell className="font-medium text-white">
                          {String(row.action ?? row.actionType)}
                        </TableCell>
                        <TableCell className="max-w-[8rem] truncate sm:max-w-none">
                          {String(row.resource_type ?? row.entity_type)}
                        </TableCell>
                        <TableCell>{String(row.actor_role ?? "—")}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {String(row.ip_address ?? "—")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-zinc-500">
                          {String(row.created_at ?? "").slice(0, 16)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prompt</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={String(row.id)}>
                        <TableCell>{String(row.promptType)}</TableCell>
                        <TableCell>{String(row.modelName)}</TableCell>
                        <TableCell className="text-pink-400">
                          {(Number(row.tokensInput) || 0) + (Number(row.tokensOutput) || 0)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-zinc-500">
                          {String(row.createdAt ?? "").slice(0, 16)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
