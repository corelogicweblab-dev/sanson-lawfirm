"use client";

import { LAWYER_CASE_WORKFLOW } from "@sanson/shared";
import { cn } from "@/lib/utils";

export function LawyerWorkflowStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn("sanson-panel sanson-workflow-panel p-4 pb-3", className)}
      role="region"
      aria-label="Lawyer case workflow — scroll sideways to see all steps"
      tabIndex={0}
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-pink-200/90">
        Lawyer legal command workflow
      </p>
      <p className="mb-3 text-[10px] text-zinc-500">Scroll sideways to view all steps →</p>
      <ol className="sanson-workflow-steps">
        {LAWYER_CASE_WORKFLOW.map((s) => (
          <li
            key={s.step}
            className={cn(
              "sanson-workflow-step sanson-glass-chip flex flex-col rounded-lg px-3 py-2.5 text-center",
              s.owner === "LAWYER"
                ? "border-pink-400/55 shadow-[0_0_20px_rgba(255,79,163,0.25)]"
                : "border-pink-500/15"
            )}
          >
            <span className="text-[10px] text-zinc-400">Step {s.step}</span>
            <span className="mt-0.5 text-xs font-medium leading-snug text-white">{s.label}</span>
            <span className="mt-1 text-[10px] text-zinc-400">{s.owner}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
