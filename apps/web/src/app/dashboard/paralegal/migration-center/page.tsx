"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FileUp,
  FolderPlus,
  UserPlus,
  CheckCircle2,
  Upload,
  Users,
  FileText,
  ExternalLink,
} from "lucide-react";
import { DocumentCenter } from "@/components/documents/document-center";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  Button,
  Card,
  CardContent,
  Input,
  PageContainer,
  SectionHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sanson/ui";

type MigrationItem = {
  id: string;
  legacyReference?: string;
  title: string;
  clientEmail?: string;
  status: string;
  errorMessage?: string;
  caseId?: string;
};

type Panel = "legacy" | "bulkCases" | "bulkDocs" | "assign" | "validate" | null;

export default function CaseMigrationCenterPage() {
  const [panel, setPanel] = useState<Panel>(null);
  const [queue, setQueue] = useState<MigrationItem[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [queueError, setQueueError] = useState("");

  const [legacyForm, setLegacyForm] = useState({
    title: "",
    client_email: "",
    legacy_reference: "",
    case_category: "CIVIL",
  });
  const [bulkCasesJson, setBulkCasesJson] = useState(
    '[\n  {"title":"Legacy Case 001","client_email":"client@sansonlaw.ph","legacy_reference":"LEG-001","case_category":"CIVIL"}\n]'
  );
  const [bulkDocsJson, setBulkDocsJson] = useState(
    '[\n  {"legacy_reference":"LEG-001","file_name":"contract.pdf","case_id":""}\n]'
  );
  const [assignItemId, setAssignItemId] = useState("");
  const [lawyerId, setLawyerId] = useState("");
  const [paralegalId, setParalegalId] = useState("");

  const load = useCallback(async () => {
    setQueueError("");
    const [q, s] = await Promise.all([
      api.getMigrationQueue(),
      api.getMigrationSummary(),
    ]);
    if (q.success && q.data) {
      setQueue(q.data as MigrationItem[]);
    } else if (!q.success) {
      setQueueError(q.message || "Could not load migration queue");
    }
    if (s.success && s.data) {
      const d = s.data as { items_by_status?: Record<string, number> };
      setSummary(d.items_by_status || {});
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<void>) => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { id: "legacy" as Panel, label: "New Legacy Case", icon: FolderPlus },
    { id: "bulkCases" as Panel, label: "Bulk Import Cases", icon: Upload },
    { id: "bulkDocs" as Panel, label: "Add Documents", icon: FileUp },
    { id: "assign" as Panel, label: "Assign Lawyer / Paralegal", icon: Users },
    { id: "validate" as Panel, label: "Validate Records", icon: CheckCircle2 },
  ];

  return (
    <AuthGuard allowedRoles={["PARALEGAL", "ADMIN"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/paralegal" },
          { label: "Case Migration Center" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Case Migration Center"
            description="Onboard legacy firm cases — paralegal-controlled import, assignment, and validation."
          />

          {error && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {message}
            </p>
          )}
          {queueError && (
            <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              {queueError}
            </p>
          )}

          <Card className="mb-6 border-pink-500/25 bg-pink-950/30">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-6 w-6 shrink-0 text-pink-400" />
                <div>
                  <p className="font-medium text-white">Add documents (PDF, images, contracts)</p>
                  <p className="text-sm text-zinc-400">
                    Upload real files in Document Center — drag & drop or browse. JSON bulk import below is for metadata only.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/paralegal/documents">
                <Button type="button">
                  <ExternalLink className="h-4 w-4" />
                  Open Document Center
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.entries(summary).map(([k, v]) => (
              <Card key={k} className="sanson-panel">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-zinc-500">{k}</p>
                  <p className="text-xl font-bold text-pink-400">{v}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setPanel(panel === a.id ? null : a.id)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                  panel === a.id
                    ? "border-pink-500/50 bg-pink-500/10"
                    : "sanson-panel hover:border-white/20"
                }`}
              >
                <a.icon className="h-6 w-6 shrink-0 text-pink-400" />
                <span className="text-sm font-medium text-white">{a.label}</span>
              </button>
            ))}
          </div>

          {panel === "legacy" && (
            <Card className="mb-6 sanson-panel">
              <CardContent className="space-y-3 p-4 sm:p-6">
                <Input label="Case title" value={legacyForm.title} onChange={(e) => setLegacyForm({ ...legacyForm, title: e.target.value })} />
                <Input label="Client email (must exist in system)" value={legacyForm.client_email} onChange={(e) => setLegacyForm({ ...legacyForm, client_email: e.target.value })} />
                <Input label="Legacy reference" value={legacyForm.legacy_reference} onChange={(e) => setLegacyForm({ ...legacyForm, legacy_reference: e.target.value })} />
                <Button
                  loading={loading}
                  onClick={() =>
                    run(async () => {
                      const r = await api.createLegacyCase(legacyForm);
                      if (!r.success) throw new Error(r.message);
                      setMessage(r.message || "Legacy case created");
                      setPanel(null);
                    })
                  }
                >
                  Create legacy case
                </Button>
              </CardContent>
            </Card>
          )}

          {panel === "bulkCases" && (
            <Card className="mb-6 sanson-panel">
              <CardContent className="p-4 sm:p-6">
                <p className="mb-2 text-xs text-zinc-500">JSON array of cases</p>
                <textarea
                  className="mb-3 min-h-[140px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white"
                  value={bulkCasesJson}
                  onChange={(e) => setBulkCasesJson(e.target.value)}
                />
                <Button
                  loading={loading}
                  onClick={() =>
                    run(async () => {
                      const cases = JSON.parse(bulkCasesJson) as Record<string, unknown>[];
                      const r = await api.bulkImportCases(cases);
                      if (!r.success) throw new Error(r.message);
                      setMessage(`Imported ${(r.data as { items?: unknown[] })?.items?.length ?? 0} rows`);
                      setPanel(null);
                    })
                  }
                >
                  Bulk import cases
                </Button>
              </CardContent>
            </Card>
          )}

          {panel === "bulkDocs" && (
            <div className="mb-6 space-y-6">
              <Card className="sanson-panel">
                <CardContent className="p-4 sm:p-6">
                  <p className="mb-3 text-sm font-medium text-white">Upload files now</p>
                  <DocumentCenter />
                </CardContent>
              </Card>
              <Card className="sanson-panel">
                <CardContent className="p-4 sm:p-6">
                  <p className="mb-2 text-xs text-zinc-500">
                    Optional: JSON metadata queue (legacy reference, file name) — not file upload
                  </p>
                  <textarea
                    className="mb-3 min-h-[120px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white"
                    value={bulkDocsJson}
                    onChange={(e) => setBulkDocsJson(e.target.value)}
                  />
                  <Button
                    loading={loading}
                    variant="outline"
                    onClick={() =>
                      run(async () => {
                        const documents = JSON.parse(bulkDocsJson) as Record<string, unknown>[];
                        const r = await api.bulkImportDocuments(documents);
                        if (!r.success) throw new Error(r.message);
                        setMessage(r.message || "Document metadata queued");
                        setPanel(null);
                      })
                    }
                  >
                    Queue metadata only
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {panel === "assign" && (
            <Card className="mb-6 sanson-panel">
              <CardContent className="space-y-3 p-4 sm:p-6">
                <Input label="Migration item ID" value={assignItemId} onChange={(e) => setAssignItemId(e.target.value)} />
                <Input label="Lawyer user ID (UUID)" value={lawyerId} onChange={(e) => setLawyerId(e.target.value)} />
                <Input label="Paralegal user ID (UUID)" value={paralegalId} onChange={(e) => setParalegalId(e.target.value)} />
                <Button
                  loading={loading}
                  onClick={() =>
                    run(async () => {
                      const r = await api.assignMigrationStaff(assignItemId, {
                        lawyer_id: lawyerId || undefined,
                        paralegal_id: paralegalId || undefined,
                      });
                      if (!r.success) throw new Error(r.message);
                      setMessage("Assignment saved");
                    })
                  }
                >
                  <UserPlus className="h-4 w-4" />
                  Assign staff
                </Button>
              </CardContent>
            </Card>
          )}

          {panel === "validate" && (
            <Card className="mb-6 sanson-panel">
              <CardContent className="p-4 sm:p-6">
                <p className="mb-3 text-sm text-zinc-400">
                  Click Validate on a pending row below to approve and import into live cases.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="sanson-panel">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-zinc-400">
                        <p className="mb-2">No legacy cases in the import queue yet.</p>
                        <p className="text-sm text-zinc-500">
                          Click <strong className="text-pink-400">New Legacy Case</strong> above to add your first record, then validate to import into live cases.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    queue.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.legacyReference || "—"}</TableCell>
                        <TableCell className="max-w-[10rem] truncate">{row.title}</TableCell>
                        <TableCell className="text-xs">{row.clientEmail || "—"}</TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell className="text-right">
                          {row.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loading}
                              onClick={() =>
                                run(async () => {
                                  const r = await api.validateMigrationRecord(row.id, {
                                    import_now: true,
                                  });
                                  if (!r.success) throw new Error(r.message);
                                  setMessage(`Validated ${row.title}`);
                                })
                              }
                            >
                              Validate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
