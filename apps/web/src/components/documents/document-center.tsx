"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Loader2,
  Sparkles,
  Download,
  AlertCircle,
} from "lucide-react";
import { Badge, Button, Card, CardContent, EmptyState } from "@sanson/ui";
import type { DocumentCategory, DocumentItem } from "@sanson/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DocumentCenterProps {
  showProcess?: boolean;
  caseId?: string;
}

export function DocumentCenter({ showProcess = false, caseId }: DocumentCenterProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

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
    load();
  }, [load]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      await api.uploadDocument(file, {
        categoryId: categoryId || undefined,
        caseId,
      });
    }
    setUploading(false);
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

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-white/20 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-6">
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition",
              dragOver ? "border-pink-400 bg-pink-500/10" : "border-white/15"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <Upload className="mb-3 h-10 w-10 text-pink-400" />
            <p className="mb-1 font-medium text-white">Drag & drop legal documents</p>
            <p className="mb-4 text-xs text-zinc-500">
              PDF, DOC, DOCX, TXT, PNG, JPG, WEBP — max 25MB
            </p>
            <div className="mb-4 flex flex-wrap items-center gap-2">
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
              <label>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Button type="button" disabled={uploading}>
                  {uploading ? "Uploading…" : "Browse files"}
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No documents yet"
          description="Upload contracts, evidence, affidavits, and supporting files."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="border-white/10 bg-white/5 backdrop-blur-md">
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
                  {doc.downloadUrl && (
                    <a href={doc.downloadUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    </a>
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
