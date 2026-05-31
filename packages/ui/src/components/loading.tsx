import { cn } from "../lib/cn";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-10 w-10" };

/** Small inline spinner — use Skeleton for page loads */
export function Loading({ size = "md", text, className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)} role="status">
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-pink-500/20 border-t-pink-500",
          sizes[size]
        )}
        aria-hidden
      />
      {text && <p className="text-sm text-zinc-400">{text}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-white/5", className)}
      aria-hidden
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("sanson-glass space-y-3 p-4 sm:p-6", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Prefer skeletons over blocking full-page spinners */
export function LoadingPage({ text }: { text?: string }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-3 py-6 sm:px-6" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonTable rows={6} />
      {text && <p className="sr-only">{text}</p>}
    </div>
  );
}
