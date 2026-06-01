"use client";

import { useEffect, useState } from "react";
import { PageContainer, SectionHeader } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LawyerCasesTable } from "@/components/lawyer/lawyer-cases-table";
import { api } from "@/lib/api";
import type { CaseItem } from "@sanson/types";

export default function LawyerCasesPage() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [paralegalNames, setParalegalNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [c, dir] = await Promise.all([
        api.listCases(),
        api.listUserDirectory("PARALEGAL"),
      ]);
      if (c.success && c.data) setItems(c.data);
      if (dir.success && dir.data) {
        const m: Record<string, string> = {};
        dir.data.forEach((u) => {
          m[String(u.id)] = String(u.display_name ?? u.email);
        });
        setParalegalNames(m);
      }
    })();
  }, []);

  return (
    <AuthGuard allowedRoles={["LAWYER"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Lawyer dashboard", href: "/dashboard/lawyer" },
          { label: "My cases" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="My cases"
            description="Full case repository — filter, review, approve, and open legal workspace."
          />
          <LawyerCasesTable items={items} paralegalNames={paralegalNames} />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
