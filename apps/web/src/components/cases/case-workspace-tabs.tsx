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

function formatPanelValue(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "object" && !Array.isArray(v)) {
    return Object.entries(v as Record<string, unknown>)
      .filter(([, val]) => val != null && val !== "")
      .map(([k, val]) => `${k.replace(/_/g, " ")}: ${formatPanelValue(val)}`)
      .join(" · ");
  }
  return String(v);
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
  const flat: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (k === "details" && v && typeof v === "object") {
      for (const [dk, dv] of Object.entries(v as Record<string, unknown>)) {
        const text = formatPanelValue(dv);
        if (text) flat.push({ key: dk, value: text });
      }
    } else {
      const text = formatPanelValue(v);
      if (text) flat.push({ key: k, value: text });
    }
  }
  return (
    <div>
      {title && <h3 className="mb-3 text-sm font-medium text-zinc-300">{title}</h3>}
      <dl className="grid gap-3 sm:grid-cols-2">
        {flat.map(({ key, value }) => (
          <div key={key} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">{key.replace(/_/g, " ")}</dt>
            <dd className="mt-1 text-sm text-zinc-200">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
