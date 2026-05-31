"use client";

import { useEffect, useState } from "react";
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

type SessionRow = {
  id: string;
  userId?: string;
  platform?: string;
  lastActiveAt: string;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.listAllSessions().then((r) => {
      if (r.success && r.data) setSessions(r.data as SessionRow[]);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (id: string) => {
    setLoading(true);
    await api.revokeSession(id);
    load();
    setLoading(false);
  };

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Sessions" }]}
      >
        <PageContainer>
          <SectionHeader
            title="Session Management"
            description="Active device sessions across the platform."
          />
          <Card className="sanson-panel">
            <CardContent className="p-0">
              {sessions.length === 0 ? (
                <p className="p-6 text-sm text-zinc-500">
                  No active sessions. Sessions are created on login after Phase 7 migrations.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">
                          {s.userId?.slice(0, 8) ?? "—"}
                        </TableCell>
                        <TableCell>{s.platform ?? "WEB"}</TableCell>
                        <TableCell className="whitespace-nowrap text-zinc-500">
                          {s.lastActiveAt?.slice(0, 16)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loading}
                            onClick={() => revoke(s.id)}
                          >
                            Revoke
                          </Button>
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
