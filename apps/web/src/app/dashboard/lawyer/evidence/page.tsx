"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { TimelineViewer } from "@/components/documents/document-center";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import type { EvidenceItemRecord } from "@sanson/types";
import { Card, CardContent, EmptyState, PageContainer, SectionHeader } from "@sanson/ui";

export default function LawyerEvidencePage() {
  const [items, setItems] = useState<EvidenceItemRecord[]>([]);

  useEffect(() => {
    api.listEvidence().then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  }, []);

  return (
    <AuthGuard allowedRoles={["LAWYER", "ADMIN"]}>
      <DashboardShell
        title="Evidence Library"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/lawyer" },
          { label: "Evidence" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Evidence Repository"
            description="Browse categorized evidence linked to cases and requests."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              {items.length === 0 ? (
                <EmptyState
                  icon={<Shield className="h-12 w-12" />}
                  title="No evidence items"
                  description="Evidence is created when documents are uploaded and classified."
                />
              ) : (
                <div className="space-y-3">
                  {items.map((e) => (
                    <Card key={e.id} className="border-white/10 bg-white/5">
                      <CardContent className="p-4">
                        <p className="font-medium text-white">{e.title}</p>
                        <p className="text-xs text-zinc-500">
                          {e.evidenceType} · {e.status}
                        </p>
                        {e.description && (
                          <p className="mt-2 text-sm text-zinc-400">{e.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <Card className="border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 font-semibold text-white">Evidence Timeline</h3>
              <TimelineViewer />
            </Card>
          </div>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
