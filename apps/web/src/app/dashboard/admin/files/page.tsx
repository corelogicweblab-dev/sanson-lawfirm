"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  PageContainer,
  SectionHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sanson/ui";
import type { DocumentItem } from "@sanson/types";
import { DocumentViewerModal } from "@/components/documents/document-viewer-modal";
import {
  loadDocumentPreview,
  releaseDocumentPreview,
  type DocumentPreview,
} from "@/lib/document-actions";

export default function AdminFilesPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const closePreview = () => {
    if (preview) releaseDocumentPreview(preview.url);
    setPreview(null);
    setPreviewDocId(null);
  };

  const openView = async (doc: DocumentItem) => {
    setViewingId(doc.id);
    setError("");
    try {
      const next = await loadDocumentPreview(doc.id, doc.fileName);
      closePreview();
      setPreview(next);
      setPreviewDocId(doc.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open file.");
    } finally {
      setViewingId(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await api.listDocuments(undefined, 100);
    if (r.success && r.data) setDocs(r.data);
    else setError(r.message ?? "Could not load files. Run migration 022 on Supabase if access denied.");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (doc: DocumentItem) => {
    const name = doc.originalFileName || doc.fileName;
    if (!window.confirm(`Delete file "${name}"? This cannot be undone.`)) return;
    const r = await api.deleteDocument(doc.id);
    if (!r.success) {
      setError(r.message ?? "Delete failed");
      return;
    }
    await load();
  };

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Admin", href: "/dashboard/admin" },
          { label: "Files" },
        ]}
      >
        <PageContainer>
          <DocumentViewerModal
            preview={preview}
            documentId={previewDocId}
            onClose={closePreview}
          />
          <SectionHeader
            title="Firm files"
            description="View and remove documents across all cases. Deletions are logged in audit."
          />
          <div className="mb-4">
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Refresh
            </Button>
          </div>
          {error && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-zinc-400">Loading files…</p>
          ) : docs.length === 0 ? (
            <EmptyState title="No files" description="Uploaded case documents appear here." />
          ) : (
            <Card className="sanson-panel overflow-x-auto">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Case</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="max-w-[14rem] truncate text-white">
                          {d.originalFileName || d.fileName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-400">
                          {d.caseId ? d.caseId.slice(0, 8) + "…" : "—"}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {d.fileSize ? `${Math.round(d.fileSize / 1024)} KB` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          {d.createdAt?.slice(0, 16) ?? "—"}
                        </TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="text-xs text-pink-400 hover:underline disabled:opacity-50"
                            disabled={viewingId === d.id}
                            onClick={() => void openView(d)}
                          >
                            {viewingId === d.id ? "Loading…" : "View"}
                          </button>
                          <Button size="sm" variant="outline" onClick={() => void remove(d)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
