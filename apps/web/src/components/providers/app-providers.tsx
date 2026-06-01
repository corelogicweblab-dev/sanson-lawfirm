"use client";

import { ApiWarmup } from "@/components/providers/api-warmup";
import { MotionProvider } from "@/components/providers/motion-provider";
import { FuturisticBackground } from "@/components/layout/futuristic-background";
import { BuildVersionGuard } from "@/components/layout/build-version-guard";
import { SystemFooter } from "@/components/layout/system-footer";
import { PrintDocumentHeader } from "@/components/print/print-document-header";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <ApiWarmup />
      <BuildVersionGuard />
      <FuturisticBackground />
      <div className="sanson-app-content sanson-readable-scope sanson-print-root flex min-h-[100dvh] flex-col">
        <PrintDocumentHeader />
        <div className="sanson-print-main flex min-h-0 flex-1 flex-col">{children}</div>
        <SystemFooter />
      </div>
    </MotionProvider>
  );
}
