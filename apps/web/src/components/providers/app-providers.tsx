"use client";

import { MotionProvider } from "@/components/providers/motion-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <MotionProvider>{children}</MotionProvider>;
}
