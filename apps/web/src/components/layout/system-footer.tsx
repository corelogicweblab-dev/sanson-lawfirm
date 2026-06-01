"use client";

import { PoweredByCoreLogic } from "@sanson/ui";

/** Single system-wide attribution — bottom of every page only. */
export function SystemFooter() {
  return (
    <footer
      className="sanson-system-footer sanson-no-print safe-bottom relative z-10 shrink-0 border-t border-white/10 py-4 text-center"
      aria-label="Site footer"
    >
      <PoweredByCoreLogic />
    </footer>
  );
}
