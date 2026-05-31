"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "client", label: "Client" },
  { id: "opposing", label: "Opposing party" },
  { id: "documents", label: "Documents" },
  { id: "timeline", label: "Timeline" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
] as const;

export type CaseWorkspaceTab = (typeof TABS)[number]["id"];

export function CaseWorkspaceTabs({
  active,
  onChange,
  modules,
}: {
  active: CaseWorkspaceTab;
  onChange: (t: CaseWorkspaceTab) => void;
  modules?: string[];
}) {
  const list = modules?.length
    ? TABS.filter((t) => modules.includes(t.id) || t.id === "overview" || t.id === "documents")
    : TABS;

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
      {list.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition",
            active === tab.id
              ? "border-pink-500 text-pink-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
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
