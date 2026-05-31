"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Badge,
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
  LoadingPage,
} from "@sanson/ui";
import { CASE_SOURCE_LABELS } from "@sanson/shared";
import type { CaseItem, CaseSourceType } from "@sanson/types";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

function CaseWorkspaceContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get("id") ?? "";
  const role = useAuthStore((s) => s.getRole());
  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [assignments, setAssignments] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");

  const dash =
    role === "LAWYER"
      ? "/dashboard/lawyer"
      : role === "PARALEGAL"
        ? "/dashboard/paralegal"
        : role === "ADMIN"
          ? "/dashboard/admin"
          : "/dashboard/client";

  useEffect(() => {
    if (!caseId) {
      setError("Missing case id");
      return;
    }
    (async () => {
      const [c, a] = await Promise.all([
        api.getCase(caseId),
        api.listCaseAssignments(caseId),
      ]);
      if (!c.success || !c.data) {
        setError(c.message || "Case not found");
        return;
      }
      setCaseItem(c.data);
      if (a.success && a.data) setAssignments(a.data);
    })();
  }, [caseId]);

  const source = caseItem?.source_type as CaseSourceType | undefined;

  return (
    <DashboardShell
      breadcrumbs={[
        { label: "Dashboard", href: dash },
        { label: "Cases", href: `${dash}/cases` },
        { label: caseItem?.case_number ?? "Workspace" },
      ]}
    >
      <PageContainer>
        {!caseId && (
          <p className="text-sm text-zinc-400">Select a case from Case Management.</p>
        )}
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {caseItem && (
          <>
            <SectionHeader
              title={caseItem.title}
              description={`${caseItem.case_number} · ${caseItem.status?.display_name ?? "—"}`}
            />
            <div className="mb-6 flex flex-wrap gap-2">
              {source && (
                <Badge variant="outline">
                  {CASE_SOURCE_LABELS[source] ?? source}
                </Badge>
              )}
              <Badge>{caseItem.case_category}</Badge>
              <Badge variant="outline">{caseItem.priority}</Badge>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-zinc-300">Case information</h3>
                  <p className="text-sm text-zinc-400">{caseItem.description || "No description"}</p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-zinc-300">Workspace modules</h3>
                  <ul className="space-y-1 text-sm text-pink-400">
                    <li>
                      <Link href={`${dash}/documents`}>Documents</Link>
                    </li>
                    <li>
                      <Link href={`${dash}/tasks`}>Tasks</Link>
                    </li>
                    <li>Timeline (via API)</li>
                    <li>Calendar events (planned)</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-white/10 bg-white/5">
              <CardContent className="p-0">
                <h3 className="border-b border-white/10 px-4 py-3 text-sm font-medium text-zinc-300">
                  Assignment history
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-zinc-500">
                          No assignment records yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignments.map((row, i) => (
                        <TableRow key={String(row.id ?? i)}>
                          <TableCell>{String(row.assignee_role ?? "—")}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {String(row.assignee_id ?? "—")}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500">
                            {String(row.assigned_at ?? row.created_at ?? "—")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {role === "ADMIN" && (
              <p className="mt-4 text-xs text-amber-400/90">
                System administrators have read-only access to cases for monitoring. Legal changes are performed by paralegals and lawyers.
              </p>
            )}
          </>
        )}
      </PageContainer>
    </DashboardShell>
  );
}

export default function CaseWorkspacePage() {
  return (
    <AuthGuard allowedRoles={["PARALEGAL", "LAWYER", "ADMIN", "CLIENT"]}>
      <Suspense fallback={<LoadingPage text="Loading case workspace..." />}>
        <CaseWorkspaceContent />
      </Suspense>
    </AuthGuard>
  );
}
