"use client";

import Link from "next/link";
import { Button } from "@sanson/ui";
import { LAWYER_AI_DRAFT_TYPES } from "@sanson/shared";
import { LawyerCenterPage } from "@/components/lawyer/lawyer-center-page";

export default function LawyerAiCenterPage() {
  return (
    <LawyerCenterPage
      title="AI legal intelligence center"
      breadcrumb="AI intelligence"
      description="Lawyer-only AI summaries, risk assessment, research assistant, and draft generators."
      features={[
        "AI case, timeline, and evidence summaries",
        "Missing requirements and risk assessment",
        "Suggested actions and next-step recommendations",
        ...LAWYER_AI_DRAFT_TYPES.map((d) => `Draft generator: ${d}`),
      ]}
    >
      <div className="sanson-panel p-5">
        <p className="mb-4 text-sm text-zinc-300">
          Open any case workspace → <strong className="text-white">AI Insights</strong> tab for
          per-matter intelligence. Firm-wide AI operations are monitored in Admin.
        </p>
        <Link href="/dashboard/lawyer/cases">
          <Button>Open my cases</Button>
        </Link>
      </div>
    </LawyerCenterPage>
  );
}
