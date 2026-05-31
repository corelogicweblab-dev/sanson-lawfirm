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
  Card,
  CardContent,
} from "@sanson/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ParalegalWorkflowStrip } from "@/components/operations/paralegal-workflow-strip";
import { api } from "@/lib/api";
import type { LegalRequest } from "@sanson/types";

export default function ParalegalIntakePage() {
  const [items, setItems] = useState<LegalRequest[]>([]);

  const load = () => {
    api.listMyRequests().then((r) => {
      if (r.success && r.data) setItems(r.data);
    });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AuthGuard allowedRoles={["PARALEGAL"]}>
      <DashboardShell
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/paralegal" },
          { label: "Intake Queue" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Intake Queue"
            description="Review AI intake, walk-ins, phone, and referrals — convert to a full case with Master Enterprise Intake."
          />
          <ParalegalWorkflowStrip className="mb-6" />

          <Card className="sanson-panel mb-6 border-pink-500/25">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Master case intake</h2>
                <p className="mt-1 text-sm text-zinc-300">
                  Walk-in, phone, referral, or AI request — use one enterprise form to create the client,
                  opposing party, case details, and auto case number (e.g. SLF-2026-001).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/paralegal/cases/new?source=WALK_IN">
                  <Button>Walk-in / phone / referral</Button>
                </Link>
                <Link href="/dashboard/paralegal/cases/new">
                  <Button variant="outline">New case (manual)</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {items.length === 0 ? (
            <EmptyState
              title="No intake requests"
              description="Client AI requests appear here. Use Master case intake above for walk-ins."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.request_reference}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>
                      <Badge>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/paralegal/cases/new?requestId=${r.id}`}>
                        <Button size="sm" variant="outline">
                          Open master intake →
                        </Button>
                      </Link>
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
