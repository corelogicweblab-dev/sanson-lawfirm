/** Opens the browser print dialog (works with any connected printer). */
export function printPage(): void {
  if (typeof window === "undefined") return;
  const stamp = document.getElementById("sanson-print-date");
  if (stamp) {
    stamp.textContent = new Date().toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  const title = document.querySelector<HTMLElement>("[data-print-title]");
  if (title) {
    const prev = document.title;
    document.title = `${title.textContent?.trim() || "SANSON Legal OS"} — SANSON Law Firm`;
    window.print();
    document.title = prev;
    return;
  }
  window.print();
}
