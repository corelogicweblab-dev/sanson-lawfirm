"use client";

import { LAWYER_CASE_WORKFLOW } from "@sanson/shared";
import { cn } from "@/lib/utils";

export function LawyerWorkflowStrip({ className }: { className?: string }) {
  return (
    <div className={cn("sanson-panel overflow-x-auto p-4", className)}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-300">
        Lawyer legal command workflow
      </p>
      <ol className="flex min-w-max gap-2">
        {LAWYER_CASE_WORKFLOW.map((s) => (
          <li
            key={s.step}
            className={cn(
              "sanson-glass-chip flex shrink-0 flex-col rounded-lg px-3 py-2 text-center",
              s.owner === "LAWYER"
                ? "border-pink-400/45 shadow-[0_0_16px_rgba(255,79,163,0.15)]"
                : "border-white/20"
            )}
          >
            <span className="text-[10px] text-zinc-400">Step {s.step}</span>
            <span className="max-w-[7rem] text-xs font-medium text-white">{s.label}</span>
            <span className="mt-0.5 text-[10px] text-zinc-400">{s.owner}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
