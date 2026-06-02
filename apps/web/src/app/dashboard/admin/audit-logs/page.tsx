"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  Button,
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
type Tab = "platform" | "ai" | "security";

export default function AuditLogsPage() {
  const [tab, setTab] = useState<Tab>("platform");
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (tab === "platform") {
      const r = await api.listAuditLogs(page, 100);
      if (r.success && r.data) setLogs(r.data as AuditRow[]);
      else setLogs([]);
    } else if (tab === "ai") {
      const r = await api.listAiAuditLogs(page, 100);
      if (r.success && r.data) setLogs(r.data as AuditRow[]);
      else setLogs([]);
    } else {
      const r = await api.listSecurityEvents();
      if (r.success && r.data) setLogs(r.data as AuditRow[]);
      else setLogs([]);
    }
    setLoading(false);
  }, [tab, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-lg px-3 py-2 text-sm sm:px-4 ${
        tab === id ? "bg-pink-600 text-white" : "bg-white/5 text-zinc-400"
      }`}
    >
      {label}
    </button>
  );

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Audit Logs" }]}
      >
        <PageContainer>
          <SectionHeader
            title="Audit & activity logs"
            description="Platform actions, AI usage, and security events across the firm."
          />
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {tabBtn("platform", "Platform")}
            {tabBtn("ai", "AI")}
            {tabBtn("security", "Security")}
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Refresh
            </Button>
            {tab !== "security" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <span className="text-xs text-zinc-500">Page {page}</span>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </>
            )}
          </div>
          <Card className="sanson-panel">
            <CardContent className="p-0 sm:p-0">
              {loading ? (
                <p className="p-6 text-sm text-zinc-500">Loading logs…</p>
              ) : logs.length === 0 ? (
                <p className="p-6 text-sm text-zinc-500">No entries for this view yet.</p>
              ) : tab === "platform" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead className="hidden md:table-cell">IP</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((row) => (
                      <TableRow key={String(row.id)}>
                        <TableCell className="font-medium text-white">
                          {String(row.action ?? row.actionType)}
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate">
                          {String(row.entity_type ?? row.resource_type)}
                          {row.entity_id ? ` · ${String(row.entity_id).slice(0, 8)}` : ""}
                        </TableCell>
                        <TableCell>{String(row.actor_role ?? row.performed_by ?? "—")}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {String(row.ip_address ?? "—")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-zinc-500">
                          {String(row.created_at ?? "").slice(0, 19).replace("T", " ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : tab === "ai" ? (
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
                    {logs.map((row) => (
                      <TableRow key={String(row.id)}>
                        <TableCell>{String(row.promptType)}</TableCell>
                        <TableCell>{String(row.modelName)}</TableCell>
                        <TableCell className="text-pink-400">
                          {(Number(row.tokensInput) || 0) + (Number(row.tokensOutput) || 0)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-zinc-500">
                          {String(row.createdAt ?? "").slice(0, 19).replace("T", " ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((row, i) => (
                      <TableRow key={String(row.id ?? i)}>
                        <TableCell className="text-white">
                          {String(row.event_type ?? row.type ?? row.action ?? "—")}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {String(row.user_id ?? row.actor_id ?? "—").slice(0, 12)}
                        </TableCell>
                        <TableCell>{String(row.ip_address ?? "—")}</TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          {String(row.created_at ?? row.createdAt ?? "").slice(0, 19).replace("T", " ")}
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
