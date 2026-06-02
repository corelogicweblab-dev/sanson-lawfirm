import { API_BASE_PATH } from "@sanson/shared";
import { getApiBaseUrl } from "@/lib/api-url";
import { api } from "@/lib/api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth";
import { normalizeClientMimeType } from "@/lib/mime-type";

async function ensureAuthToken(): Promise<void> {
  const stored = useAuthStore.getState().firebaseToken;
  if (stored) api.setToken(stored);
  if (!isFirebaseConfigured()) return;
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    api.setToken(token);
    useAuthStore.getState().setToken(token);
  } catch {
    /* keep existing token */
  }
}

export type DocumentDisposition = "inline" | "attachment";

export type DocumentPreview = {
  url: string;
  mimeType: string;
  fileName: string;
};

export function documentContentUrl(
  documentId: string,
  disposition: DocumentDisposition = "inline"
): string {
  return `${getApiBaseUrl()}${API_BASE_PATH}/documents/${documentId}/content?disposition=${disposition}`;
}

export function releaseDocumentPreview(url: string): void {
  URL.revokeObjectURL(url);
}

async function fetchDocumentBlob(
  documentId: string,
  disposition: DocumentDisposition
): Promise<Blob> {
  await ensureAuthToken();
  const url = documentContentUrl(documentId, disposition);
  const headers: Record<string, string> = {};
  const token = api.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers, credentials: "same-origin" });
  if (!response.ok) {
    const text = await response.text();
    let message = text.slice(0, 200);
    try {
      const json = JSON.parse(text) as { message?: string; detail?: string; error?: string };
      message = json.message || json.detail || json.error || message;
    } catch {
      /* plain text */
    }
    throw new Error(message || `Could not load file (${response.status})`);
  }
  return response.blob();
}

/** Load file for in-page viewer (no pop-up). Caller must revoke url via releaseDocumentPreview. */
export async function loadDocumentPreview(
  documentId: string,
  fileName: string
): Promise<DocumentPreview> {
  const blob = await fetchDocumentBlob(documentId, "inline");
  const mimeType =
    blob.type && blob.type !== "application/octet-stream"
      ? blob.type
      : normalizeClientMimeType({ name: fileName } as File);
  return {
    url: URL.createObjectURL(blob),
    mimeType,
    fileName,
  };
}

/** @deprecated Use loadDocumentPreview + DocumentViewerModal */
export async function viewDocument(documentId: string, fileName: string): Promise<DocumentPreview> {
  return loadDocumentPreview(documentId, fileName);
}

/** Save file to disk. */
export async function downloadDocument(documentId: string, fileName: string): Promise<void> {
  const blob = await fetchDocumentBlob(documentId, "attachment");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Print via hidden iframe (no pop-up). */
export async function printDocument(documentId: string, fileName: string): Promise<void> {
  const blob = await fetchDocumentBlob(documentId, "inline");
  const url = URL.createObjectURL(blob);

  const stamp = document.getElementById("sanson-print-date");
  if (stamp) {
    stamp.textContent = new Date().toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  const titleEl = document.querySelector<HTMLElement>("[data-print-title]");
  if (titleEl) titleEl.textContent = fileName;

  const iframe = document.createElement("iframe");
  iframe.className = "sanson-no-print";
  iframe.setAttribute("title", `Print ${fileName}`);
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1px;height:1px;border:0;opacity:0";
  iframe.src = url;
  document.body.appendChild(iframe);

  const cleanup = () => {
    iframe.remove();
    URL.revokeObjectURL(url);
  };

  const triggerPrint = () => {
    window.setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        throw new Error(
          "Could not open the print dialog for this file. Try View, then use your browser print."
        );
      }
      window.setTimeout(cleanup, 60_000);
    }, 800);
  };

  iframe.onload = triggerPrint;
  iframe.onerror = () => {
    cleanup();
    throw new Error("Could not load file for printing.");
  };
}
