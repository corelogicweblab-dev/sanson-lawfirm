"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

const fieldBase =
  "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 text-sm text-white transition-all duration-200";
const fieldFocus =
  "focus-within:outline-none focus-within:ring-2 focus-within:ring-pink-500/40 focus-within:border-pink-500/30";
const inputInner =
  "min-w-0 flex-1 border-0 bg-transparent px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, showPasswordToggle = true, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const [visible, setVisible] = React.useState(false);
    const inputType = isPassword && visible ? "text" : type;

    const sharedInputProps = {
      ref,
      id: inputId,
      type: inputType,
      "data-password-input": isPassword ? true : undefined,
      ...props,
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}

        {isPassword && showPasswordToggle ? (
          <div
            className={cn(
              fieldBase,
              fieldFocus,
              error && "border-red-500/50 focus-within:ring-red-500/40",
              className
            )}
          >
            <input
              {...sharedInputProps}
              className={cn(inputInner, "rounded-l-xl")}
              autoComplete={props.autoComplete ?? "current-password"}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={visible ? "Hide password" : "Show password"}
              className={cn(
                "flex h-10 w-11 shrink-0 items-center justify-center rounded-r-xl",
                "border-l border-white/10 text-zinc-400",
                "hover:bg-white/[0.06] hover:text-zinc-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 focus-visible:ring-inset"
              )}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        ) : (
          <input
            {...sharedInputProps}
            className={cn(
              fieldBase,
              "px-4 py-2 placeholder:text-zinc-500",
              "focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/30",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500/50 focus:ring-red-500/40",
              className
            )}
          />
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
