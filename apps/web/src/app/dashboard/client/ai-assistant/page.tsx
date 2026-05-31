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
        <PageContainer>
          <SectionHeader
            title="AI Legal Assistant"
            description="Your first consultation layer — gather facts and explore whether you may need representation."
          />
          <div className="mb-4">
            <LegalDisclaimer />
          </div>
          <AiAssistantChat />
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
