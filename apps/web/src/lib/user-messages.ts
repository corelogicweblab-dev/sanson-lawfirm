/** End-user facing messages — no infrastructure / developer details. */

export function friendlyApiError(fallback = "Something went wrong. Please try again."): string {
  return fallback;
}

export function friendlyNetworkError(): string {
  return "Cannot reach the server right now. Check your connection and try again.";
}

export function friendlySyncError(): string {
  return "Sign-in could not be completed. Please try again in a moment.";
}

export function friendlyUploadError(detail?: string): string {
  if (!detail) return "Upload failed. Please try again.";
  const d = detail.toLowerCase();
  if (d.includes("lawyers review documents")) {
    return "Lawyer accounts cannot upload files. Sign in as a paralegal to add case documents.";
  }
  if (d.includes("permission denied") || d.includes("documents:write")) {
    return "Your account does not have permission to upload documents. Use a paralegal account.";
  }
  if (d.includes("authentication") || d.includes("invalid or expired token")) {
    return "Your session expired. Sign out, sign in again, then retry the upload.";
  }
  if (d.includes("not allowed") || d.includes("mime type")) {
    return "This file type is not supported. Use PDF, Office docs, images, video, audio, or ZIP.";
  }
  if (
    d.includes("too large") ||
    d.includes("exceeds") ||
    d.includes("limit") ||
    d.includes("413")
  ) {
    return "This file is too large for upload. Try compressing it or contact your administrator.";
  }
  if (d.includes("storage") || d.includes("r2") || d.includes("cloudflare")) {
    return "File storage is temporarily unavailable. Ask your administrator to verify Cloudflare R2 on Render.";
  }
  if (d.includes("empty file")) {
    return "The selected file is empty. Choose a different file.";
  }
  if (
    d.includes("networkerror") ||
    d.includes("failed to fetch") ||
    d.includes("load failed")
  ) {
    return "Connection blocked by the browser. Refresh the page (Ctrl+Shift+R). If it continues, disable ad blockers for this site.";
  }
  if (detail.length <= 160 && !detail.includes("postgresql") && !detail.includes("asyncpg")) {
    return detail;
  }
  return "Upload failed. Please try again.";
}
