import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const theme = {
  colors: {
    background: "#0a0a0a",
    surface: "#111111",
    accent: "#ec4899",
    accentLight: "#f472b6",
    text: "#ffffff",
    muted: "#a1a1aa",
    border: "rgba(236, 72, 153, 0.15)",
  },
} as const;

export * from "./components/button";
export * from "./components/input";
export * from "./components/card";
export * from "./components/badge";
export * from "./components/dialog";
export * from "./components/table";
export * from "./components/data-table-shell";
export * from "./components/loading";
export * from "./components/empty-state";
export * from "./components/error-state";
export * from "./components/page-container";
export * from "./components/section-header";
export * from "./components/stat-card";
export * from "./components/powered-by";
