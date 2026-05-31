import { cn } from "../lib/cn";

interface DataTableShellProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
}

/** Horizontal scroll wrapper for wide tables on mobile. */
export function DataTableShell({
  children,
  className,
  minWidth = 560,
}: DataTableShellProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto overscroll-x-contain rounded-xl border border-white/10",
        "[-webkit-overflow-scrolling:touch]",
        className
      )}
    >
      <div style={{ minWidth }} className="w-full">
        {children}
      </div>
    </div>
  );
}
