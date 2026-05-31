"use client";

import { PARALEGAL_CASE_WORKFLOW } from "@sanson/shared";
import { cn } from "@/lib/utils";

export function ParalegalWorkflowStrip({ className }: { className?: string }) {
  return (
    <div className={cn("sanson-panel overflow-x-auto p-4", className)}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-pink-300">
        Paralegal-centric case workflow
      </p>
      <ol className="flex min-w-max gap-2">
        {PARALEGAL_CASE_WORKFLOW.map((s) => (
          <li
            key={s.step}
            className={cn(
              "flex shrink-0 flex-col rounded-lg border px-3 py-2 text-center",
              s.owner === "PARALEGAL"
                ? "border-pink-500/40 bg-black/40"
                : s.owner === "LAWYER"
                  ? "border-violet-500/30 bg-black/35"
                  : "border-white/15 bg-black/30"
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
