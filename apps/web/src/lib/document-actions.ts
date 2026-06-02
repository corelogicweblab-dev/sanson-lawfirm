import { API_BASE_PATH } from "@sanson/shared";
import { getApiBaseUrl } from "@/lib/api-url";
import { api } from "@/lib/api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth";

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

export function documentContentUrl(
  documentId: string,
  disposition: DocumentDisposition = "inline"
): string {
  return `${getApiBaseUrl()}${API_BASE_PATH}/documents/${documentId}/content?disposition=${disposition}`;
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

/** Open file in a new tab for viewing. */
export async function viewDocument(documentId: string, fileName: string): Promise<void> {
  const blob = await fetchDocumentBlob(documentId, "inline");
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.alert("Pop-up blocked. Allow pop-ups for this site to view the file.");
    URL.revokeObjectURL(url);
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
  void fileName;
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

/** Print via hidden iframe (loads authenticated blob URL). */
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
    "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none";
  iframe.src = url;
  document.body.appendChild(iframe);

  const cleanup = () => {
    iframe.remove();
    URL.revokeObjectURL(url);
  };

  iframe.onload = () => {
    window.setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      window.setTimeout(cleanup, 60_000);
    }, 600);
  };

  iframe.onerror = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    cleanup();
  };
}
