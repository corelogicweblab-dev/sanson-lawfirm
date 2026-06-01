"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AiAssistantChat } from "@/components/ai/ai-assistant-chat";
import { LegalDisclaimer } from "@/components/ai/legal-disclaimer";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageContainer, SectionHeader } from "@sanson/ui";

export default function AiAssistantPage() {
  return (
    <AuthGuard allowedRoles={["CLIENT"]}>
      <DashboardShell
        title="AI Legal Assistant"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/client" },
          { label: "AI Legal Assistant" },
        ]}
      >
        <PageContainer className="flex h-[calc(100dvh-4.75rem)] max-h-[calc(100dvh-4.75rem)] flex-col overflow-hidden !pb-3 !pt-3 sm:!pb-4 sm:h-[calc(100dvh-5.25rem)] sm:max-h-[calc(100dvh-5.25rem)]">
          <div className="shrink-0 space-y-2">
            <SectionHeader
              title="AI Legal Assistant"
              description="Your first consultation layer — gather facts and explore whether you may need representation."
            />
            <LegalDisclaimer compact />
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-hidden">
            <AiAssistantChat />
          </div>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
