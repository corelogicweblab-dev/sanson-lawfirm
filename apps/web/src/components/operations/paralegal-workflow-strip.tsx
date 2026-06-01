"use client";

import { PARALEGAL_CASE_WORKFLOW } from "@sanson/shared";
import { cn } from "@/lib/utils";

const ownerStyles: Record<string, string> = {
  PARALEGAL: "border-pink-400/45 shadow-[0_0_16px_rgba(255,79,163,0.15)]",
  LAWYER: "border-violet-400/35",
  CLIENT: "border-white/20",
  SYSTEM: "border-emerald-400/30",
};

export function ParalegalWorkflowStrip({ className }: { className?: string }) {
  return (
    <div className={cn("sanson-panel sanson-workflow-panel p-4", className)}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-300">
        Paralegal-centric case workflow
      </p>
      <ol className="sanson-workflow-steps">
        {PARALEGAL_CASE_WORKFLOW.map((s) => (
          <li
            key={s.step}
            className={cn(
              "sanson-glass-chip flex min-w-0 flex-col rounded-lg px-3 py-2.5 text-center",
              ownerStyles[s.owner] ?? "border-white/20"
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
