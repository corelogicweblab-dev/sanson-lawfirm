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

type Deployment = {
  id: string;
  environment: string;
  service: string;
  version?: string;
  gitRef?: string;
  status: string;
  deployedAt: string;
};

type MigrationStatus = {
  applied_count?: number;
  latest_version?: string;
};

export default function DeploymentPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [migrations, setMigrations] = useState<MigrationStatus>({});
  const [env, setEnv] = useState<Record<string, unknown>>({});

  useEffect(() => {
    api.listDeployments().then((r) => {
      if (r.success && r.data) setDeployments(r.data as Deployment[]);
    });
    api.getMigrationStatus().then((r) => {
      if (r.success && r.data) setMigrations(r.data as MigrationStatus);
    });
    api.getOpsEnvironment().then((r) => {
      if (r.success && r.data) setEnv(r.data as Record<string, unknown>);
    });
  }, []);

  const validation = (env.validation || {}) as Record<string, unknown>;

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Deployment" }]}
      >
        <PageContainer>
          <SectionHeader
            title="Deployment Dashboard"
            description="CI/CD history, migrations, and environment validation."
          />
          <Card className="mb-6 sanson-panel">
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm text-zinc-300">
                <span className="text-zinc-500">Environment:</span> {String(env.environment ?? "—")}
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                <span className="text-zinc-500">Valid:</span> {validation.valid ? "Yes" : "Review required"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Schema v{migrations.latest_version ?? "?"} · {migrations.applied_count ?? 0} migrations
              </p>
            </CardContent>
          </Card>
          <Card className="sanson-panel">
            <CardContent className="p-0">
              {deployments.length === 0 ? (
                <p className="p-6 text-sm text-zinc-500">
                  No deployments recorded. CI can POST to /api/v1/ops/deployments after deploy.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="hidden sm:table-cell">Env</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deployments.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.service}</TableCell>
                        <TableCell className="hidden sm:table-cell">{d.environment}</TableCell>
                        <TableCell className="max-w-[6rem] truncate sm:max-w-none">
                          {d.version ?? d.gitRef ?? "—"}
                        </TableCell>
                        <TableCell>{d.status}</TableCell>
                        <TableCell className="whitespace-nowrap text-zinc-500">
                          {d.deployedAt?.slice(0, 16)}
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
