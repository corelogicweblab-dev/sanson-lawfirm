import { API_BASE_PATH } from "@sanson/shared";
import { RENDER_API_URL } from "@/lib/api-url";

export interface XhrUploadResult {
  ok: boolean;
  status: number;
  text: string;
}

/** Multipart POST via XHR — avoids fetch+Abort issues; use direct Render (not Netlify proxy). */
export function xhrMultipartUpload(
  url: string,
  formData: FormData,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<XhrUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const timer = window.setTimeout(() => {
      xhr.abort();
    }, timeoutMs);

    xhr.onload = () => {
      window.clearTimeout(timer);
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, text: xhr.responseText });
    };
    xhr.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Upload connection failed. Check your network and try again."));
    };
    xhr.ontimeout = () => {
      window.clearTimeout(timer);
      reject(new Error("Upload timed out. Try a smaller file or wait and retry."));
    };
    xhr.open("POST", url, true);
    xhr.timeout = timeoutMs;
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.send(formData);
  });
}

export function getRenderMultipartUploadUrl(): string {
  return `${RENDER_API_URL}${API_BASE_PATH}/documents/upload`;
}

/** PUT file bytes to R2 presigned URL (bypasses Netlify 30s proxy limit). */
export async function putToPresignedUrl(
  uploadUrl: string,
  file: File,
  mimeType: string,
  timeoutMs: number
): Promise<void> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": mimeType },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Storage upload failed (${res.status}). Ask admin to verify R2 CORS on the bucket.`);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Upload timed out. Try a smaller file or wait and retry.");
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}
