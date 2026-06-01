"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from "@sanson/ui";
import { LawyerCenterPage } from "@/components/lawyer/lawyer-center-page";
import { api } from "@/lib/api";
import type { CaseItem } from "@sanson/types";

export default function LawyerClientsPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);

  useEffect(() => {
    api.listCases().then((r) => {
      if (r.success && r.data) setCases(r.data);
    });
  }, []);

  const byClient = cases.reduce<Record<string, CaseItem[]>>((acc, c) => {
    const id = c.client_id;
    if (!acc[id]) acc[id] = [];
    acc[id].push(c);
    return acc;
  }, {});

  return (
    <LawyerCenterPage
      title="Client management center"
      breadcrumb="Clients"
      description="Client 360 — profile, cases, documents, appointments, and legal notes."
      features={[
        "Client profile and contact",
        "All cases per client",
        "Document and evidence history",
        "Communication and appointment history",
      ]}
    >
      <div className="sanson-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client ID</TableHead>
              <TableHead>Cases</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(byClient).map(([clientId, list]) => (
              <TableRow key={clientId}>
                <TableCell className="font-mono text-xs">{clientId.slice(0, 8)}…</TableCell>
                <TableCell>{list.length}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/case?id=${list[0].id}`}>
                    <Button size="sm" variant="outline">
                      Open latest case
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </LawyerCenterPage>
  );
}
