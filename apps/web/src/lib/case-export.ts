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

async function downloadCaseExport(
  caseId: string,
  path: "brief" | "pleadings",
  fallbackName: string
): Promise<void> {
  await ensureAuthToken();
  const url = `${getApiBaseUrl()}${API_BASE_PATH}/cases/${caseId}/export/${path}`;
  const headers: Record<string, string> = {};
  const token = api.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers, credentials: "same-origin" });
  if (!response.ok) {
    const text = await response.text();
    let message = text.slice(0, 200);
    try {
      const json = JSON.parse(text) as { message?: string; detail?: string };
      message = json.message || json.detail || message;
    } catch {
      /* plain */
    }
    throw new Error(message || `Export failed (${response.status})`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] ?? fallbackName;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

export function downloadCaseBriefDocx(caseId: string, caseNumber: string): Promise<void> {
  const safe = caseNumber.replace(/[^\w-]+/g, "_");
  return downloadCaseExport(caseId, "brief", `${safe}_case_brief.docx`);
}

export function downloadCasePleadingsDocx(caseId: string, caseNumber: string): Promise<void> {
  const safe = caseNumber.replace(/[^\w-]+/g, "_");
  return downloadCaseExport(caseId, "pleadings", `${safe}_pleadings_pack.docx`);
}
