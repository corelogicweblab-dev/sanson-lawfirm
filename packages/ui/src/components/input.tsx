"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, showPasswordToggle = true, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const [visible, setVisible] = React.useState(false);
    const inputType = isPassword && visible ? "text" : type;

    const inputEl = (
      <input
        ref={ref}
        id={inputId}
        type={inputType}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-white",
          "placeholder:text-zinc-500",
          "focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200",
          isPassword && showPasswordToggle ? "pl-4 pr-11" : "px-4",
          error && "border-red-500/50 focus:ring-red-500/40",
          className
        )}
        {...props}
      />
    );

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        {isPassword && showPasswordToggle ? (
          <div className="relative">
            {inputEl}
            <button
              type="button"
              tabIndex={-1}
              aria-label={visible ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          inputEl
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
