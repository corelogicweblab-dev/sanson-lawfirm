"use client";

import { MotionProvider } from "@/components/providers/motion-provider";
import { FuturisticBackground } from "@/components/layout/futuristic-background";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <FuturisticBackground />
      <div className="sanson-app-content">{children}</div>
    </MotionProvider>
  );
}
