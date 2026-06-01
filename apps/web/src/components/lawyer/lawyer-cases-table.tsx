"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
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
import { LAWYER_CASE_FILTERS, filterLawyerCases, computeCaseRiskScore } from "@sanson/shared";
import type { CaseItem } from "@sanson/types";
import { cn } from "@/lib/utils";

type Props = {
  items: CaseItem[];
  paralegalNames?: Record<string, string>;
};

export function LawyerCasesTable({ items, paralegalNames = {} }: Props) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => filterLawyerCases(items, filter), [items, filter]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {LAWYER_CASE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              filter === f.id
                ? "bg-pink-500 text-white"
                : "border border-white/20 bg-black/40 text-zinc-300 hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No cases match this filter"
          description="Cases appear when paralegals create and assign matters to you."
        />
      ) : (
        <div className="sanson-panel overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Paralegal</TableHead>
                <TableHead>AI risk</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const risk = computeCaseRiskScore(c);
                const paraId = c.assigned_paralegal_id;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.case_number}</TableCell>
                    <TableCell className="max-w-[12rem] truncate">{c.title}</TableCell>
                    <TableCell>{c.case_category}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.status?.display_name ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>{c.priority}</TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {paraId ? paralegalNames[paraId] ?? "Assigned" : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge>{risk.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/case?id=${c.id}`}>
                          <Button size="sm" variant="outline">
                            Open
                          </Button>
                        </Link>
                        <Link href={`/dashboard/case?id=${c.id}&tab=notes`}>
                          <Button size="sm" variant="ghost">
                            Notes
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
