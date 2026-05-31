import * as React from "react";
import { cn } from "../lib/cn";
import { motionButton } from "../motion/classes";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

const variants = {
  default:
    "bg-gradient-to-r from-[#BE185D] via-[#EC4899] to-[#FF4FA3] text-white hover:from-[#EC4899] hover:via-[#F472B6] hover:to-[#FF4FA3] shadow-lg shadow-[#FF4FA3]/30",
  secondary:
    "bg-white/10 text-white border border-white/15 hover:bg-white/15 hover:border-[#F9A8D4]/40 hover:shadow-[0_0_20px_rgba(255,79,163,0.2)]",
  ghost: "text-pink-100 hover:text-white hover:bg-white/10",
  destructive: "bg-red-600/90 text-white hover:bg-red-500",
  outline:
    "border border-white/20 text-[#F9A8D4] hover:bg-white/10 hover:border-[#FF4FA3]/50 hover:shadow-[0_0_16px_rgba(255,79,163,0.25)]",
};

const sizes = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      data-variant={variant}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium",
        motionButton(),
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-pulse rounded-full bg-white/30"
          aria-hidden
        />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
