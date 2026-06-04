"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  PageContainer,
  SectionHeader,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sanson/ui";

export default function AiOperationsPage() {
  const [health, setHealth] = useState<Record<string, unknown>>({});
  const [aiLogs, setAiLogs] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api.getSystemHealth().then((r) => {
      if (r.success && r.data) setHealth(r.data as Record<string, unknown>);
    });
    api.listAiAuditLogs(1, 30).then((r) => {
      if (r.success && r.data) setAiLogs(r.data as Record<string, unknown>[]);
    });
  }, []);

  const ai = (health.ai_usage || {}) as Record<string, number>;
  const aiConfigured = Boolean(health.ai_chat_configured);
  const provider = String(health.ai_provider ?? "none");

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "AI Operations" }]}
      >
        <PageContainer>
          <SectionHeader
            title="AI Operations"
            description="Token usage, models, and audit trail."
          />
          {!aiConfigured && (
            <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              The client AI assistant has no model configured. Set <code>GEMINI_API_KEY</code> (free
              tier) or <code>OPENAI_API_KEY</code> in the Render backend environment, then redeploy.
              Until then, clients see a fallback reply instead of AI answers.
            </p>
          )}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              title="AI Assistant"
              value={aiConfigured ? `On (${provider})` : "Off"}
            />
            <StatCard title="Calls" value={ai.total_calls ?? 0} />
            <StatCard title="Tokens in" value={ai.tokens_input ?? 0} />
            <StatCard title="Tokens out" value={ai.tokens_output ?? 0} />
          </div>
          <Card className="sanson-panel">
            <CardContent className="p-0">
              {aiLogs.length === 0 ? (
                <p className="p-6 text-sm text-zinc-500">No AI audit entries yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prompt</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiLogs.map((row) => (
                      <TableRow key={String(row.id)}>
                        <TableCell>{String(row.promptType)}</TableCell>
                        <TableCell>{String(row.modelName)}</TableCell>
                        <TableCell className="text-pink-400">
                          {(Number(row.tokensInput) || 0) + (Number(row.tokensOutput) || 0)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-zinc-500">
                          {String(row.createdAt ?? "").slice(0, 16)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
