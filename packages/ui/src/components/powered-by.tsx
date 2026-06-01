import { cn } from "../lib/cn";

interface PoweredByProps {
  className?: string;
}

export function PoweredByCoreLogic({ className }: PoweredByProps) {
  return (
    <p className={cn("text-xs text-zinc-300", className)}>
      Powered By:{" "}
      <span className="font-medium text-pink-200">CoreLogic</span>
    </p>
  );
}
