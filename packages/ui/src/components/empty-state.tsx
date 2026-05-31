import { Inbox } from "lucide-react";
import { cn } from "../lib/cn";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No data yet",
  description = "There is nothing to display at the moment.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10",
        "bg-white/[0.02] px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400">
        {icon || <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-zinc-300">{description}</p>
      {action}
    </div>
  );
}
