"use client";

import Link from "next/link";
import { Sparkles, FileText, Shield, Calendar, AlertTriangle } from "lucide-react";
import { Badge, Button } from "@sanson/ui";
import { computeCaseRiskScore } from "@sanson/shared";
import type { CaseItem } from "@sanson/types";

type Props = {
  caseItem: CaseItem;
  docCount?: number;
  evidenceCount?: number;
};

export function CaseIntelligenceCard({ caseItem, docCount = 0, evidenceCount = 0 }: Props) {
  const risk = computeCaseRiskScore(caseItem);
  const master = caseItem.master_data ?? {};
  const dates = master.important_dates as Record<string, string> | undefined;
  const missingDocs = docCount === 0 ? "Documents missing" : null;
  const missingEvidence = evidenceCount === 0 ? "No evidence on file" : null;

  return (
    <div className="sanson-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-zinc-400">{caseItem.case_number}</p>
          <h3 className="font-semibold text-white">{caseItem.title}</h3>
        </div>
        <Badge
          variant={risk.level === "CRITICAL" || risk.level === "HIGH" ? "default" : "outline"}
        >
          AI Risk: {risk.label}
        </Badge>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-2 text-zinc-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <span>{missingDocs || missingEvidence || "File package in progress"}</span>
        </div>
        <div className="flex items-start gap-2 text-zinc-300">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-pink-300" />
          <span>
            Next: {dates?.hearing_date || dates?.next_deadline || "—"}
          </span>
        </div>
        <div className="flex items-start gap-2 text-zinc-300">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-pink-300" />
          <span>
            {docCount} docs · {evidenceCount} evidence
          </span>
        </div>
        <div className="flex items-start gap-2 text-zinc-300">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-pink-300" />
          <span>{caseItem.status?.display_name ?? "—"}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
        <Sparkles className="h-4 w-4 text-pink-300" />
        <p className="flex-1 text-xs text-zinc-400">
          AI summary & recommendations available in case workspace → AI Insights tab.
        </p>
        <Link href={`/dashboard/case?id=${caseItem.id}&tab=ai`}>
          <Button size="sm" variant="outline">
            Open intelligence
          </Button>
        </Link>
      </div>
    </div>
  );
}
