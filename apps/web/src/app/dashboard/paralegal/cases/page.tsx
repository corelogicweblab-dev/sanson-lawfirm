"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PageContainer,
  SectionHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  EmptyState,
  Badge,
} from "@sanson/ui";
import { CASE_SOURCE_LABELS } from "@sanson/shared";
import type { CaseItem, CaseSourceType } from "@sanson/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";

export default function ParalegalCasesPage() {
  const [items, setItems] = useState<CaseItem[]>([]);

  useEffect(() => {
    api.listCases().then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  }, []);

  return (
    <AuthGuard allowedRoles={["PARALEGAL"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/paralegal" },
          { label: "Case Management" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Centralized Case Repository"
            description="All legacy, AI intake, and manual cases — single system (paralegal-operated)."
          />
          {items.length === 0 ? (
            <EmptyState
              title="No cases yet"
              description="Import legacy cases in Migration Center or convert AI intake requests."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => {
                  const src = c.source_type as CaseSourceType | undefined;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>{c.case_number}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {src ? CASE_SOURCE_LABELS[src] : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{c.status?.display_name ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/case?id=${c.id}`}
                          className="text-sm text-pink-400 hover:underline"
                        >
                          Open workspace
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
