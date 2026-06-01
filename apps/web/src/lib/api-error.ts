/** Normalize FastAPI / API error bodies into a single user-facing string. */
export function extractApiErrorMessage(
  body: Record<string, unknown> | null | undefined,
  fallback = "Request failed"
): string {
  if (!body) return fallback;

  const message = body.message;
  if (typeof message === "string" && message.trim()) return message;

  const detail = body.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg?: string }).msg ?? "");
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length) return parts.join(". ");
  }

  const errors = body.errors;
  if (Array.isArray(errors) && errors.length) {
    const first = errors[0] as { message?: string };
    if (first?.message) return first.message;
  }

  return fallback;
}
