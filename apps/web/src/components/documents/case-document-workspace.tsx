"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, ExternalLink, Loader2 } from "lucide-react";
import { DocumentCenter, TimelineViewer } from "@/components/documents/document-center";
import { Card, CardContent, EmptyState } from "@sanson/ui";
import type { CaseItem } from "@sanson/types";
import { api } from "@/lib/api";
import { useClientSearchParams } from "@/lib/use-client-search-params";

interface CaseDocumentWorkspaceProps {
  showProcess?: boolean;
  readOnly?: boolean;
  allowPrint?: boolean;
  showTimeline?: boolean;
  /** Allow client uploads on their selected case */
}

export function CaseDocumentWorkspace({
  showProcess = false,
  readOnly = false,
  allowPrint = true,
  showTimeline = false,
}: CaseDocumentWorkspaceProps) {
  const searchParams = useClientSearchParams();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [caseId, setCaseId] = useState("");
  const [loadingCases, setLoadingCases] = useState(true);

  const loadCases = useCallback(async () => {
    setLoadingCases(true);
    const res = await api.listCases(200);
    if (res.success && res.data) {
      setCases(res.data);
    }
    setLoadingCases(false);
  }, []);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  useEffect(() => {
    const fromUrl = searchParams.get("case") ?? searchParams.get("id") ?? "";
    if (fromUrl && cases.some((c) => c.id === fromUrl)) {
      setCaseId(fromUrl);
    }
  }, [searchParams, cases]);

  const selected = cases.find((c) => c.id === caseId);

  return (
    <div className="space-y-6">
      <Card className="sanson-panel border-pink-500/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="sanson-case-select"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-white"
              >
                <Briefcase className="h-4 w-4 text-pink-400" />
                Select case (required)
              </label>
              {loadingCases ? (
                <p className="flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading cases…
                </p>
              ) : (
                <select
                  id="sanson-case-select"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full max-w-xl rounded-lg border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white"
                >
                  <option value="">— Choose a case —</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.title}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-2 text-xs text-zinc-500">
                All files are stored inside the selected case only. Open a case workspace for full
                intake and review.
              </p>
            </div>
            {selected && (
              <Link
                href={`/dashboard/case/?id=${selected.id}`}
                className="inline-flex items-center rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Open case workspace
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {!caseId ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="No case selected"
          description="Choose a case above to view, upload, and organize documents for that matter only."
        />
      ) : (
        <>
          {selected && (
            <p className="text-sm text-zinc-400">
              Files for{" "}
              <span className="font-medium text-pink-200">
                {selected.case_number} — {selected.title}
              </span>
            </p>
          )}
          <DocumentCenter
            caseId={caseId}
            showProcess={showProcess}
            readOnly={readOnly}
            allowPrint={allowPrint}
            uploadDisabled={readOnly}
            uploadDisabledHint="File uploads for this case are handled by your assigned paralegal."
          />
          {showTimeline && (
            <Card className="sanson-panel p-6">
              <h3 className="mb-4 font-semibold text-white">Timeline Review</h3>
              <TimelineViewer caseId={caseId} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
