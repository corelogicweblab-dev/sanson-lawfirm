"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const BASE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "client", label: "Client" },
  { id: "opposing", label: "Opposing party" },
  { id: "documents", label: "Documents" },
  { id: "timeline", label: "Timeline" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
] as const;

const LAWYER_EXTRA_TABS = [
  { id: "evidence", label: "Evidence" },
  { id: "calendar", label: "Calendar" },
  { id: "activities", label: "Activities" },
  { id: "ai", label: "AI Insights" },
  { id: "audit", label: "Audit" },
] as const;

const ALL_TAB_IDS = [...BASE_TABS, ...LAWYER_EXTRA_TABS].map((t) => t.id);

export type CaseWorkspaceTab = (typeof ALL_TAB_IDS)[number];

export function CaseWorkspaceTabs({
  active,
  onChange,
  modules,
  lawyerMode,
}: {
  active: CaseWorkspaceTab;
  onChange: (t: CaseWorkspaceTab) => void;
  modules?: string[];
  lawyerMode?: boolean;
}) {
  const tabs = lawyerMode ? [...BASE_TABS, ...LAWYER_EXTRA_TABS] : [...BASE_TABS];

  const list = modules?.length
    ? tabs.filter((t) => modules.includes(t.id) || t.id === "overview" || t.id === "documents")
    : tabs;

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
      {list.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id as CaseWorkspaceTab)}
          className={cn(
            "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition",
            active === tab.id
              ? "border-pink-500 text-pink-400"
              : "border-transparent text-zinc-400 hover:text-white"
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export function CaseDataPanel({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown> | undefined;
}) {
  if (!data || !Object.keys(data).length) {
    return <p className="text-sm text-zinc-500">No data recorded.</p>;
  }
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {Object.entries(data).map(([k, v]) =>
        v ? (
          <div key={k}>
            <dt className="text-xs uppercase text-zinc-500">{k.replace(/_/g, " ")}</dt>
            <dd className="text-sm text-zinc-200">{String(v)}</dd>
          </div>
        ) : null
      )}
    </dl>
  );
}
