"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import { Card, CardContent, PageContainer, SectionHeader, StatCard } from "@sanson/ui";

interface SearchAnalytics {
  total_searches?: number;
  popular_searches?: { query: string; count: number }[];
  qdrant_configured?: boolean;
  openai_configured?: boolean;
  embedding_statistics?: { documents: number; cases: number; evidence: number; total: number };
  knowledge_usage?: { article_views: number };
  ai_usage_metrics?: { intelligence_events: number };
}

export default function SearchAnalyticsPage() {
  const [stats, setStats] = useState<SearchAnalytics>({});

  useEffect(() => {
    api.getSearchAnalytics().then((r) => {
      if (r.success && r.data) setStats(r.data as SearchAnalytics);
    });
  }, []);

  const emb = stats.embedding_statistics;

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        title="Search Analytics"
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Search Analytics" }]}
      >
        <PageContainer>
          <SectionHeader
            title="Search Intelligence"
            description="Semantic search usage, embeddings, knowledge, and AI metrics."
          />
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Searches" value={stats.total_searches ?? 0} />
            <StatCard title="Qdrant" value={stats.qdrant_configured ? "Connected" : "Off"} />
            <StatCard title="OpenAI" value={stats.openai_configured ? "On" : "Off"} />
            <StatCard title="AI Events" value={stats.ai_usage_metrics?.intelligence_events ?? 0} />
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Doc Embeddings" value={emb?.documents ?? 0} />
            <StatCard title="Case Embeddings" value={emb?.cases ?? 0} />
            <StatCard title="Evidence Embeddings" value={emb?.evidence ?? 0} />
            <StatCard title="Knowledge Views" value={stats.knowledge_usage?.article_views ?? 0} />
          </div>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-white">Popular Searches</h3>
              {(stats.popular_searches || []).length === 0 ? (
                <p className="text-sm text-zinc-500">No searches recorded yet.</p>
              ) : (
                (stats.popular_searches || []).map((p) => (
                  <div key={p.query} className="flex justify-between border-b border-white/5 py-2 text-sm">
                    <span className="text-zinc-300">{p.query}</span>
                    <span className="text-zinc-500">{p.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
