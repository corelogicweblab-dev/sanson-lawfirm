"use client";

import { Printer } from "lucide-react";
import { Button } from "@sanson/ui";
import { printPage } from "@/lib/print";
import { cn } from "@/lib/utils";

type PrintButtonProps = {
  label?: string;
  variant?: "ghost" | "outline" | "secondary";
  size?: "sm" | "md" | "icon";
  className?: string;
  showLabel?: boolean;
};

export function PrintButton({
  label = "Print",
  variant = "ghost",
  size = "icon",
  className,
  showLabel = false,
}: PrintButtonProps) {
  if (showLabel || size !== "icon") {
    return (
      <Button
        type="button"
        variant={variant}
        size={size === "icon" ? "sm" : size === "md" ? "md" : "sm"}
        className={cn("sanson-no-print gap-2", className)}
        title="Print this page (Ctrl+P)"
        onClick={() => printPage()}
      >
        <Printer className="h-4 w-4 shrink-0" />
        {label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      className={cn("sanson-no-print sanson-topbar-icon-btn h-9 w-9 sm:h-10 sm:w-10", className)}
      title="Print this page (Ctrl+P)"
      aria-label="Print page"
      onClick={() => printPage()}
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
}
