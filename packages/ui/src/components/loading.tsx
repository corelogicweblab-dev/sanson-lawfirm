import { cn } from "../lib/cn";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" };

export function Loading({ size = "md", text, className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-pink-500/20 border-t-pink-500",
          sizes[size]
        )}
      />
      {text && <p className="text-sm text-zinc-400">{text}</p>}
    </div>
  );
}

export function LoadingPage({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-white/5", className)} />
  );
}
