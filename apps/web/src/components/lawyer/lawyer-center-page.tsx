"use client";

import { ReactNode } from "react";
import { PageContainer, SectionHeader, Card, CardContent } from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";

type Props = {
  title: string;
  description: string;
  breadcrumb: string;
  children?: ReactNode;
  features?: string[];
};

export function LawyerCenterPage({
  title,
  description,
  breadcrumb,
  children,
  features = [],
}: Props) {
  return (
    <AuthGuard allowedRoles={["LAWYER"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Lawyer dashboard", href: "/dashboard/lawyer" },
          { label: breadcrumb },
        ]}
      >
        <PageContainer>
          <SectionHeader title={title} description={description} />
          {children}
          {features.length > 0 && (
            <Card className="sanson-panel mt-6">
              <CardContent className="p-5">
                <p className="mb-3 text-sm font-medium text-white">Capabilities</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
                  {features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
