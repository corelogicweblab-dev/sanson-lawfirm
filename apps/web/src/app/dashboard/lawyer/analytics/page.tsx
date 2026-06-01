"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@sanson/ui";
import { Briefcase, Scale, FileText } from "lucide-react";
import { LawyerCenterPage } from "@/components/lawyer/lawyer-center-page";
import { api } from "@/lib/api";
import type { CaseItem } from "@sanson/types";

export default function LawyerAnalyticsPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);

  useEffect(() => {
    api.listCases().then((r) => {
      if (r.success && r.data) setCases(r.data);
    });
  }, []);

  const byType = cases.reduce<Record<string, number>>((acc, c) => {
    acc[c.case_category] = (acc[c.case_category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <LawyerCenterPage
      title="Analytics center"
      breadcrumb="Analytics"
      description="Executive metrics — caseload, status mix, hearings, deadlines, and productivity."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Total cases" value={cases.length} icon={<Briefcase className="h-5 w-5" />} />
        <StatCard
          title="Active"
          value={cases.filter((c) => c.status?.name !== "CLOSED").length}
          icon={<Scale className="h-5 w-5" />}
        />
        <StatCard title="Case types" value={Object.keys(byType).length} icon={<FileText className="h-5 w-5" />} />
      </div>
      <div className="sanson-panel p-4">
        <p className="mb-2 text-sm font-medium text-white">Cases by type</p>
        <ul className="space-y-1 text-sm text-zinc-300">
          {Object.entries(byType).map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span>{k}</span>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </LawyerCenterPage>
  );
}
