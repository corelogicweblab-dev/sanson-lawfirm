import * as React from "react";
import { cn } from "../lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

const variants = {
  default:
    "bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-500 hover:to-pink-400 shadow-lg shadow-pink-500/20",
  secondary:
    "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-pink-500/30",
  ghost: "text-zinc-300 hover:text-white hover:bg-white/5",
  destructive: "bg-red-600/90 text-white hover:bg-red-500",
  outline: "border border-pink-500/30 text-pink-400 hover:bg-pink-500/10",
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
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
