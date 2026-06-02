"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@sanson/ui";
import { downloadCaseBriefDocx, downloadCasePleadingsDocx } from "@/lib/case-export";

interface CaseExportActionsProps {
  caseId: string;
  caseNumber: string;
  /** Show full pleadings pack (brief + all case documents) */
  showPleadings?: boolean;
  compact?: boolean;
}

export function CaseExportActions({
  caseId,
  caseNumber,
  showPleadings = true,
  compact = false,
}: CaseExportActionsProps) {
  const [loading, setLoading] = useState<"brief" | "pleadings" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: "brief" | "pleadings") => {
    setError(null);
    setLoading(kind);
    try {
      if (kind === "brief") {
        await downloadCaseBriefDocx(caseId, caseNumber);
      } else {
        await downloadCasePleadingsDocx(caseId, caseNumber);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "space-y-2"}>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!!loading}
          onClick={() => void run("brief")}
        >
          {loading === "brief" ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <FileDown className="mr-1 h-3 w-3" />
          )}
          Brief (.docx)
        </Button>
        {showPleadings && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!!loading}
            onClick={() => void run("pleadings")}
          >
            {loading === "pleadings" ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <FileDown className="mr-1 h-3 w-3" />
            )}
            Pleadings pack (.docx)
          </Button>
        )}
      </div>
      {!compact && (
        <p className="text-xs text-zinc-500">
          Word files include the case brief and all uploaded pleadings/documents for printing or
          court filing.
        </p>
      )}
      {error && (
        <p className="text-xs text-red-300">{error}</p>
      )}
    </div>
  );
}
