"use client";

import { Suspense, useEffect, useState } from "react";
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
import {
  CaseWorkspaceTabs,
  CaseDataPanel,
  type CaseWorkspaceTab,
} from "@/components/cases/case-workspace-tabs";
import { DocumentCenter } from "@/components/documents/document-center";
import { CaseWorkspaceOps } from "@/components/operations/case-workspace-ops";
import { ParalegalWorkflowStrip } from "@/components/operations/paralegal-workflow-strip";
import { LawyerWorkflowStrip } from "@/components/lawyer/lawyer-workflow-strip";
import { LegalNotebookFloat } from "@/components/lawyer/legal-notebook-float";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

function CaseWorkspaceContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get("id") ?? "";
  const initialTab = (searchParams.get("tab") as CaseWorkspaceTab) || "overview";
  const role = useAuthStore((s) => s.getRole());
  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [assignments, setAssignments] = useState<Record<string, unknown>[]>([]);
  const [tab, setTab] = useState<CaseWorkspaceTab>(initialTab);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

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
  }, [caseId, reloadKey]);

  const source = caseItem?.source_type as CaseSourceType | undefined;
  const master = (caseItem?.master_data || {}) as Record<string, unknown>;
  const modules = master.workspace_modules as string[] | undefined;
  const clientSnap = master.client_snapshot as Record<string, unknown> | undefined;
  const caseDetails = master.case_details as Record<string, unknown> | undefined;
  const dates = master.important_dates as Record<string, unknown> | undefined;
  const notes = master.internal_notes as Record<string, unknown> | undefined;
  const party = caseItem?.parties?.[0] as Record<string, unknown> | undefined;

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
            <div className="mb-4 flex flex-wrap gap-2">
              {source && (
                <Badge variant="outline">{CASE_SOURCE_LABELS[source] ?? source}</Badge>
              )}
              <Badge>{caseItem.case_category}</Badge>
              <Badge variant="outline">{caseItem.priority}</Badge>
            </div>

            {role === "PARALEGAL" && <ParalegalWorkflowStrip className="mb-6" />}
            {role === "LAWYER" && <LawyerWorkflowStrip className="mb-6" />}

            <CaseWorkspaceTabs
              active={tab}
              onChange={setTab}
              modules={modules}
              lawyerMode={role === "LAWYER"}
            />

            {tab === "overview" && (
              <div className="space-y-6">
                <CaseWorkspaceOps
                  caseId={caseId}
                  role={role}
                  onUpdated={() => setReloadKey((k) => k + 1)}
                />
                <Card className="sanson-panel">
                  <CardContent className="p-4">
                    <h3 className="mb-2 text-sm font-medium text-zinc-300">Summary</h3>
                    <p className="text-sm text-zinc-400">{caseItem.description || "—"}</p>
                    <CaseDataPanel title="" data={caseDetails} />
                  </CardContent>
                </Card>
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-300">
                    Case documents
                  </h3>
                  <DocumentCenter
                    caseId={caseId}
                    showProcess={role === "PARALEGAL"}
                    readOnly={role === "LAWYER"}
                    allowPrint={role === "LAWYER" || role === "PARALEGAL"}
                  />
                </div>
                <Card className="sanson-panel">
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
                              No assignments yet.
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
              </div>
            )}

            {tab === "client" && (
              <Card className="sanson-panel p-4">
                <CaseDataPanel title="Client" data={clientSnap} />
              </Card>
            )}

            {tab === "opposing" && (
              <Card className="sanson-panel p-4">
                {party ? (
                  <CaseDataPanel title="Opposing" data={party} />
                ) : (
                  <p className="text-sm text-zinc-500">No opposing party on file.</p>
                )}
              </Card>
            )}

            {tab === "documents" && (
              <DocumentCenter
                caseId={caseId}
                showProcess={role === "PARALEGAL"}
                readOnly={role === "LAWYER"}
                allowPrint={role === "LAWYER" || role === "PARALEGAL"}
              />
            )}

            {tab === "timeline" && (
              <Card className="sanson-panel p-4">
                <CaseDataPanel title="Important dates" data={dates} />
                <p className="mt-4 text-xs text-zinc-500">
                  Add events via Paralegal operations on Overview tab.
                </p>
              </Card>
            )}

            {tab === "notes" && (
              <Card className="sanson-panel p-4">
                <CaseDataPanel title="Internal notes" data={notes} />
              </Card>
            )}

            {tab === "tasks" && (
              <p className="text-sm text-zinc-400">
                Tasks for this case — use Tasks in the sidebar or add via intake.
              </p>
            )}

            {tab === "evidence" && role === "LAWYER" && (
              <Card className="sanson-panel p-4">
                <p className="text-sm text-zinc-300">
                  Evidence review — validate, reject, or request more from the{" "}
                  <a href="/dashboard/lawyer/evidence" className="text-pink-400 underline">
                    Evidence Review Center
                  </a>
                  .
                </p>
              </Card>
            )}

            {tab === "calendar" && role === "LAWYER" && (
              <Card className="sanson-panel p-4">
                <CaseDataPanel title="Important dates" data={dates} />
                <p className="mt-4 text-xs text-zinc-500">
                  Full legal calendar in sidebar → Calendar.
                </p>
              </Card>
            )}

            {tab === "activities" && role === "LAWYER" && (
              <Card className="sanson-panel p-4">
                <p className="text-sm text-zinc-400">
                  Recent case activities appear in Case Intelligence on the lawyer dashboard and in
                  team collaboration feeds.
                </p>
              </Card>
            )}

            {tab === "ai" && role === "LAWYER" && (
              <Card className="sanson-panel p-4">
                <p className="mb-3 text-sm text-zinc-300">
                  AI case summary, risk assessment, missing requirements, and draft generators.
                </p>
                <a href="/dashboard/lawyer/ai-center" className="text-sm text-pink-400 underline">
                  Open AI Legal Intelligence Center →
                </a>
              </Card>
            )}

            {tab === "audit" && role === "LAWYER" && (
              <Card className="sanson-panel p-4">
                <p className="text-sm text-zinc-400">
                  Immutable audit trail for case access, uploads, approvals, and status changes —
                  full logs in Admin → Audit.
                </p>
              </Card>
            )}

            {role === "LAWYER" && caseId && (
              <LegalNotebookFloat caseId={caseId} caseNumber={caseItem.case_number} />
            )}

            {role === "ADMIN" && (
              <p className="mt-4 text-xs text-amber-400/90">
                Read-only monitoring. Legal work is performed by paralegals and lawyers.
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
