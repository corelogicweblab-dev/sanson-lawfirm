import { cn } from "../lib/cn";

interface PoweredByProps {
  className?: string;
}

export function PoweredByCoreLogic({ className }: PoweredByProps) {
  return (
    <p className={cn("text-xs text-zinc-500", className)}>
      Powered By:{" "}
      <span className="font-medium text-pink-400/80">CoreLogic</span>
    </p>
  );
}
