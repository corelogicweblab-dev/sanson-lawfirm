import { AlertTriangle } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-500/20",
        "bg-red-500/5 px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-zinc-400">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
