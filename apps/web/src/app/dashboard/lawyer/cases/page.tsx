"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer, SectionHeader, Button, EmptyState } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LawyerCasesTable } from "@/components/lawyer/lawyer-cases-table";
import { api } from "@/lib/api";
import type { CaseItem } from "@sanson/types";

function LawyerCasesPageContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") ?? "all";
  const [items, setItems] = useState<CaseItem[]>([]);
  const [paralegalNames, setParalegalNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, queueRes, dir] = await Promise.all([
        api.listCases(),
        api.getLawyerReviewQueue(),
        api.listUserDirectory("PARALEGAL"),
      ]);
      const byId = new Map<string, CaseItem>();
      if (casesRes.success && casesRes.data) {
        casesRes.data.forEach((c) => byId.set(c.id, c));
      } else if (!casesRes.success) {
        setError(casesRes.message ?? "Could not load cases.");
      }
      if (queueRes.success && queueRes.data) {
        queueRes.data.forEach((c) => byId.set(c.id, c));
      }
      setItems([...byId.values()]);
      if (dir.success && dir.data) {
        const m: Record<string, string> = {};
        dir.data.forEach((u) => {
          m[String(u.id)] = String(u.display_name ?? u.email);
        });
        setParalegalNames(m);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load cases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
          {error && (
            <div className="sanson-panel mb-4 flex flex-wrap items-center justify-between gap-3 border-amber-500/35 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p>{error}</p>
              <Button size="sm" variant="outline" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          )}
          {loading ? (
            <p className="text-sm text-zinc-400">Loading cases…</p>
          ) : items.length === 0 && !error ? (
            <EmptyState
              title="No cases yet"
              description="Paralegals create matters here; your dashboard counts update as soon as they file a draft."
            />
          ) : (
            <LawyerCasesTable
              items={items}
              paralegalNames={paralegalNames}
              initialFilter={initialFilter}
            />
          )}
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}

export default function LawyerCasesPage() {
  return (
    <Suspense fallback={null}>
      <LawyerCasesPageContent />
    </Suspense>
  );
}
