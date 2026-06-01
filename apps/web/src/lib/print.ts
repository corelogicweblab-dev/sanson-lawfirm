/** Print a single case document (opens file then browser print dialog). */
export function printDocument(fileName: string, downloadUrl: string | null | undefined): void {
  if (typeof window === "undefined") return;
  if (!downloadUrl) {
    window.alert("Download link not available for this file yet.");
    return;
  }

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
  iframe.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none";
  iframe.src = downloadUrl;
  document.body.appendChild(iframe);

  const cleanup = () => {
    iframe.remove();
  };

  iframe.onload = () => {
    window.setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      }
      window.setTimeout(cleanup, 60_000);
    }, 600);
  };

  iframe.onerror = () => {
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
    cleanup();
  };
}

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
