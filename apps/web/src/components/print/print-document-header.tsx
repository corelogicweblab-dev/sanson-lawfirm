"use client";

/**
 * Shown only on paper — firm letterhead line for any printed page.
 */
export function PrintDocumentHeader() {
  return (
    <header className="sanson-print-only" aria-hidden>
      <div className="sanson-print-letterhead">
        <div>
          <p className="sanson-print-firm-name">SANSON Law Firm</p>
          <p className="sanson-print-system-name">SANSON Legal OS</p>
        </div>
        <p className="sanson-print-meta">
          Printed: <span id="sanson-print-date" />
        </p>
      </div>
      <p className="sanson-print-title" data-print-title />
    </header>
  );
}
