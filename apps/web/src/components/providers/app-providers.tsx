"use client";

import { MotionProvider } from "@/components/providers/motion-provider";
import { FuturisticBackground } from "@/components/layout/futuristic-background";
import { BuildVersionGuard, BuildVersionStamp } from "@/components/layout/build-version-guard";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <BuildVersionGuard />
      <FuturisticBackground />
      <div className="sanson-app-content">{children}</div>
      <BuildVersionStamp />
    </MotionProvider>
  );
}
