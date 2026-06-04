"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  Badge,
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
  fullName?: string;
  email?: string;
  role?: string;
  platform?: string;
  ipAddress?: string;
  loginAt?: string;
  lastActiveAt?: string;
  lastLoginAt?: string;
};

function fmt(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 16).replace("T", " ");
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
            title="Session & login monitor"
            description="Who is signed in, from where, and when they last logged in."
          />
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={load}>
              Refresh
            </Button>
            <span className="text-xs text-zinc-500">{sessions.length} active session(s)</span>
          </div>

          {sessions.length === 0 ? (
            <Card className="sanson-panel">
              <CardContent>
                <p className="text-sm text-zinc-500">
                  No active sessions yet. A session is recorded each time a user signs in.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile: stacked cards (no side scroll) */}
              <div className="space-y-3 md:hidden">
                {sessions.map((s) => (
                  <Card key={s.id} className="sanson-panel">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{s.fullName ?? "—"}</p>
                          <p className="truncate text-xs text-zinc-400">{s.email ?? "—"}</p>
                        </div>
                        <Badge>{s.role ?? "—"}</Badge>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        <dt className="text-zinc-500">Logged in</dt>
                        <dd className="text-right text-zinc-200">{fmt(s.loginAt ?? s.lastLoginAt)}</dd>
                        <dt className="text-zinc-500">Last active</dt>
                        <dd className="text-right text-zinc-200">{fmt(s.lastActiveAt)}</dd>
                        <dt className="text-zinc-500">Platform</dt>
                        <dd className="text-right text-zinc-200">{s.platform ?? "WEB"}</dd>
                        <dt className="text-zinc-500">IP</dt>
                        <dd className="text-right text-zinc-200">{s.ipAddress ?? "—"}</dd>
                      </dl>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={loading}
                        onClick={() => revoke(s.id)}
                      >
                        Revoke session
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop: table */}
              <Card className="sanson-panel hidden md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Logged in</TableHead>
                        <TableHead>Last active</TableHead>
                        <TableHead className="hidden lg:table-cell">Platform</TableHead>
                        <TableHead className="hidden lg:table-cell">IP</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <p className="font-medium text-white">{s.fullName ?? "—"}</p>
                            <p className="text-xs text-zinc-400">{s.email ?? "—"}</p>
                          </TableCell>
                          <TableCell>
                            <Badge>{s.role ?? "—"}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-zinc-300">
                            {fmt(s.loginAt ?? s.lastLoginAt)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-zinc-400">
                            {fmt(s.lastActiveAt)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{s.platform ?? "WEB"}</TableCell>
                          <TableCell className="hidden lg:table-cell text-zinc-400">
                            {s.ipAddress ?? "—"}
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
                </CardContent>
              </Card>
            </>
          )}
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
