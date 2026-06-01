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
  if (detail.toLowerCase().includes("not allowed")) {
    return "This file type is not supported. Use PDF, Office docs, images, video, audio, or ZIP.";
  }
  if (detail.toLowerCase().includes("exceeds") || detail.toLowerCase().includes("limit")) {
    return "This file is too large for upload. Try compressing it or contact your administrator.";
  }
  return "Upload failed. Please try again.";
}
