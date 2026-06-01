"use client";

import { MotionProvider } from "@/components/providers/motion-provider";
import { FuturisticBackground } from "@/components/layout/futuristic-background";
import { BuildVersionGuard, BuildVersionStamp } from "@/components/layout/build-version-guard";
import { SystemFooter } from "@/components/layout/system-footer";
import { PrintDocumentHeader } from "@/components/print/print-document-header";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <BuildVersionGuard />
      <FuturisticBackground />
      <div className="sanson-app-content sanson-readable-scope sanson-print-root flex min-h-[100dvh] flex-col">
        <PrintDocumentHeader />
        <div className="sanson-print-main flex min-h-0 flex-1 flex-col">{children}</div>
        <SystemFooter />
      </div>
      <BuildVersionStamp />
    </MotionProvider>
  );
}
