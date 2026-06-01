"use client";

import { LawyerCenterPage } from "@/components/lawyer/lawyer-center-page";

export default function LawyerReportsPage() {
  return (
    <LawyerCenterPage
      title="Reports center"
      breadcrumb="Reports"
      description="Generate case, client, monthly, hearing, deadline, and productivity reports."
      features={[
        "Case and client reports",
        "Monthly and hearing reports",
        "Export PDF and Excel (roadmap)",
      ]}
    >
      <div className="sanson-panel p-5 text-sm text-zinc-300">
        Report templates and PDF export will connect to case and audit APIs. Use Analytics center
        for live metrics today.
      </div>
    </LawyerCenterPage>
  );
}
