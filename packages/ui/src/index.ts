import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const theme = {
  pink: {
    primary: "#EC4899",
    luxury: "#F472B6",
    soft: "#F9A8D4",
    dark: "#BE185D",
    glow: "#FF4FA3",
  },
  black: "#080808",
  charcoal: "#111111",
  graphite: "#1A1A1A",
  colors: {
    background: "#BE185D",
    surface: "rgba(255,255,255,0.08)",
    accent: "#EC4899",
    accentLight: "#F472B6",
    text: "#ffffff",
    muted: "#FCE7F3",
    border: "rgba(255, 255, 255, 0.15)",
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
export * from "./motion/tokens";
export * from "./motion/classes";
