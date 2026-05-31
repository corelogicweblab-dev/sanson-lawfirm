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
  Button,
} from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { api } from "@/lib/api";
import type { CaseItem } from "@sanson/types";

export default function LawyerApprovalsPage() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const load = () => {
    api.listCases().then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const pending = items.filter(
    (c) =>
      c.status?.name === "UNDER_REVIEW" ||
      c.status?.name === "WAITING_DOCUMENTS" ||
      c.status?.name === "OPEN"
  );

  return (
    <AuthGuard allowedRoles={["LAWYER"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/lawyer" },
          { label: "Approvals" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Legal review & approvals"
            description="Lawyers approve cases and close matters — no routine file encoding."
          />
          {pending.length === 0 ? (
            <EmptyState
              title="No cases awaiting approval"
              description="Paralegals prepare cases and assign you when ready for legal review."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.case_number}</TableCell>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>
                      <Badge>{c.status?.display_name ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Link href={`/dashboard/case?id=${c.id}`}>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        loading={loading === c.id}
                        onClick={async () => {
                          setLoading(c.id);
                          await api.updateCase(c.id, { status_name: "IN_PROGRESS" });
                          setLoading(null);
                          load();
                        }}
                      >
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
