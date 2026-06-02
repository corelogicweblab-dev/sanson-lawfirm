"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  Upload,
  Loader2,
  Sparkles,
  Download,
  Printer,
  AlertCircle,
  Eye,
} from "lucide-react";
import { downloadDocument, printDocument, viewDocument } from "@/lib/document-actions";
import { Badge, Button, Card, CardContent, EmptyState } from "@sanson/ui";
import type { DocumentCategory, DocumentItem } from "@sanson/types";
import { api } from "@/lib/api";
import { friendlyUploadError } from "@/lib/user-messages";
import { cn } from "@/lib/utils";

const UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg,.webp,.gif,.zip,.rar,.7z,.mp4,.mov,.avi,.mkv,.webm,.m4a,.mp3,.wav,.aac,.ogg,.flac,.xls,.xlsx,.ppt,.pptx";

interface DocumentCenterProps {
  showProcess?: boolean;
  caseId?: string;
  /** Lawyers: view/download only — no uploads (paralegal-centric file authority). */
  readOnly?: boolean;
  /** Print per file — lawyer & paralegal only (not clients or public pages). */
  allowPrint?: boolean;
  /** Intake form: show upload UI but block until case is saved. */
  uploadDisabled?: boolean;
  uploadDisabledHint?: string;
}

export function DocumentCenter({
  showProcess = false,
  caseId,
  readOnly = false,
  allowPrint = true,
  uploadDisabled = false,
  uploadDisabledHint = "Click “Create draft case” above to enable uploads for this matter.",
}: DocumentCenterProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionDocId, setActionDocId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runDocAction = async (
    docId: string,
    action: "view" | "download" | "print",
    fileName: string
  ) => {
    setActionError(null);
    setActionDocId(docId);
    try {
      if (action === "view") await viewDocument(docId, fileName);
      else if (action === "download") await downloadDocument(docId, fileName);
      else await printDocument(docId, fileName);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not open file.");
    } finally {
      setActionDocId(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [docs, cats] = await Promise.all([
      api.listDocuments(caseId),
      api.listDocumentCategories(),
    ]);
    if (docs.success && docs.data) setDocuments(docs.data);
    if (cats.success && cats.data) setCategories(cats.data);
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    if (!caseId && uploadDisabled) {
      setLoading(false);
      setDocuments([]);
      return;
    }
    load();
  }, [load, caseId, uploadDisabled]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (uploadDisabled || !caseId) {
      setUploadError(uploadDisabledHint);
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const list = Array.from(files);
      for (const file of list) {
        const res = await api.uploadDocument(file, {
          categoryId: categoryId || undefined,
          caseId,
        });
        if (!res.success) {
          setUploadError(friendlyUploadError(res.message ?? undefined));
          break;
        }
      }
    } catch (err) {
      setUploadError(
        friendlyUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.")
      );
    } finally {
      setUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    await load();
  };

  const handleProcess = async (id: string) => {
    setProcessingId(id);
    await api.processDocument(id);
    setProcessingId(null);
    await load();
  };

  const formatSize = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadsLocked = uploadDisabled || !caseId;

  if (loading && caseId) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!readOnly && (
      <Card className="border-dashed border-white/20 bg-white/5 backdrop-blur-md">
        <CardContent className="p-6">
          {uploadsLocked && (
            <p className="mb-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-100">
              {uploadDisabledHint}
            </p>
          )}
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition",
              uploadsLocked && "opacity-75",
              dragOver && !uploadsLocked ? "border-pink-400 bg-pink-500/10" : "border-white/15"
            )}
            onDragOver={(e) => {
              if (uploadsLocked) return;
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              if (uploadsLocked) return;
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <Upload className="mb-3 h-10 w-10 text-pink-400" />
            <p className="mb-1 font-medium text-white">Drag & drop legal documents</p>
            <p className="mb-4 text-xs text-zinc-400">
              PDF, Office, images, video, audio, ZIP — linked to this case only
            </p>
            {uploadError && (
              <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                <span className="text-left">{uploadError}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploading || uploadsLocked}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Retry upload
                </Button>
              </div>
            )}
            {uploading && (
              <p className="mb-2 text-xs text-pink-200">Connecting to firm server and uploading…</p>
            )}
            <div className="mb-4 flex w-full flex-wrap items-center justify-center gap-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="">Category (optional)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
              <input
                id="sanson-file-upload"
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                accept={UPLOAD_ACCEPT}
                disabled={uploadsLocked || uploading}
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                disabled={uploading}
                onClick={() => {
                  if (uploadsLocked) {
                    setUploadError(uploadDisabledHint);
                    return;
                  }
                  fileInputRef.current?.click();
                }}
              >
                {uploading ? "Uploading…" : "Browse files"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No documents yet"
          description={
            readOnly
              ? "No documents on this case yet. Paralegals add files in Document Center."
              : "Upload contracts, evidence, affidavits, photos, video, audio, and court filings."
          }
        />
      ) : (
        <div className="space-y-3">
          {actionError && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {actionError}
            </p>
          )}
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="sanson-panel">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{doc.fileName}</p>
                    <p className="text-xs text-zinc-500">
                      {formatSize(doc.fileSize)} · v{doc.versionNumber}
                    </p>
                  </div>
                  <Badge variant="secondary">{doc.reviewStatus}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionDocId === doc.id}
                    onClick={() => runDocAction(doc.id, "view", doc.fileName)}
                  >
                    {actionDocId === doc.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Eye className="mr-1 h-3 w-3" />
                    )}
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionDocId === doc.id}
                    onClick={() => runDocAction(doc.id, "download", doc.fileName)}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                  {allowPrint && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionDocId === doc.id}
                      onClick={() => runDocAction(doc.id, "print", doc.fileName)}
                    >
                      <Printer className="mr-1 h-3 w-3" />
                      Print
                    </Button>
                  )}
                  {showProcess && (
                    <Button
                      size="sm"
                      disabled={processingId === doc.id}
                      onClick={() => handleProcess(doc.id)}
                    >
                      {processingId === doc.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1 h-3 w-3" />
                      )}
                      OCR + AI
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}

export function TimelineViewer({ caseId, documentId }: { caseId?: string; documentId?: string }) {
  const [events, setEvents] = useState<import("@sanson/types").EvidenceTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.listEvidenceTimelines({ caseId, documentId });
      if (res.success && res.data) setEvents(res.data);
      setLoading(false);
    })();
  }, [caseId, documentId]);

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin text-pink-400" />;
  }

  if (!events.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <AlertCircle className="h-4 w-4" />
        No timeline events — process a document to generate.
      </div>
    );
  }

  return (
    <div className="relative space-y-0 border-l border-pink-500/30 pl-6">
      {events.map((ev) => (
        <div key={ev.id} className="relative pb-8">
          <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full bg-pink-500" />
          <p className="text-xs font-mono text-pink-300">{ev.eventDate}</p>
          <p className="font-medium text-white">{ev.eventTitle}</p>
          {ev.eventDescription && (
            <p className="mt-1 text-sm text-zinc-400">{ev.eventDescription}</p>
          )}
          {ev.location && (
            <p className="mt-1 text-xs text-zinc-500">{ev.location}</p>
          )}
        </div>
      ))}
    </div>
  );
}
