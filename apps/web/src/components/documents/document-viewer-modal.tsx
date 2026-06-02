"use client";

import { useEffect } from "react";
import { Download, Printer, X } from "lucide-react";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@sanson/ui";
import { downloadDocument, printDocument } from "@/lib/document-actions";
import type { DocumentPreview } from "@/lib/document-actions";

interface DocumentViewerModalProps {
  preview: DocumentPreview | null;
  documentId: string | null;
  onClose: () => void;
  allowPrint?: boolean;
}

function isImageMime(mime: string) {
  return mime.startsWith("image/");
}

function isPdfMime(mime: string, fileName: string) {
  return mime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

function isVideoMime(mime: string) {
  return mime.startsWith("video/");
}

function isAudioMime(mime: string) {
  return mime.startsWith("audio/");
}

export function DocumentViewerModal({
  preview,
  documentId,
  onClose,
  allowPrint = true,
}: DocumentViewerModalProps) {
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview, onClose]);

  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && onClose()}>
      {preview && documentId && (
        <DialogContent
          className="flex max-h-[92vh] w-[min(96vw,72rem)] max-w-none flex-col p-0"
          onClose={onClose}
        >
          <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <DialogTitle className="truncate pr-8 text-base">{preview.fileName}</DialogTitle>
            <div className="flex shrink-0 items-center gap-2">
              {allowPrint && (
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => void printDocument(documentId, preview.fileName)}
                >
                  <Printer className="mr-1 h-3 w-3" />
                  Print
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => void downloadDocument(documentId, preview.fileName)}
              >
                <Download className="mr-1 h-3 w-3" />
                Download
              </Button>
              <Button size="icon" variant="ghost" type="button" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto bg-black/60 p-4">
            {isImageMime(preview.mimeType) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={preview.fileName}
                className="mx-auto max-h-[75vh] max-w-full object-contain"
              />
            )}
            {isPdfMime(preview.mimeType, preview.fileName) && (
              <iframe
                title={preview.fileName}
                src={preview.url}
                className="h-[75vh] w-full rounded-lg border border-white/10 bg-white"
              />
            )}
            {isVideoMime(preview.mimeType) && (
              <video
                src={preview.url}
                controls
                className="mx-auto max-h-[75vh] max-w-full rounded-lg"
              />
            )}
            {isAudioMime(preview.mimeType) && (
              <audio src={preview.url} controls className="mx-auto w-full max-w-lg" />
            )}
            {!isImageMime(preview.mimeType) &&
              !isPdfMime(preview.mimeType, preview.fileName) &&
              !isVideoMime(preview.mimeType) &&
              !isAudioMime(preview.mimeType) && (
                <p className="text-center text-sm text-zinc-400">
                  Preview not available for this file type. Use Download to open it on your device.
                </p>
              )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
