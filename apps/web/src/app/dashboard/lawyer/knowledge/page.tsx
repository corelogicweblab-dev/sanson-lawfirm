"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import type { KnowledgeArticleItem } from "@sanson/types";
import { Card, CardContent, EmptyState, PageContainer, SectionHeader } from "@sanson/ui";

export default function KnowledgeCenterPage() {
  const [articles, setArticles] = useState<KnowledgeArticleItem[]>([]);

  useEffect(() => {
    api.listKnowledgeArticles().then((r) => {
      if (r.success && r.data) setArticles(r.data);
    });
  }, []);

  return (
    <AuthGuard allowedRoles={["LAWYER", "PARALEGAL", "ADMIN", "CLIENT"]}>
      <DashboardShell
        title="Knowledge Center"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/lawyer" },
          { label: "Knowledge" },
        ]}
      >
        <PageContainer>
          <SectionHeader
            title="Internal Knowledge Base"
            description="Firm procedures, templates, policies, and legal research notes."
          />
          {articles.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title="No published articles"
              description="Knowledge articles will appear here once published by staff."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {articles.map((a) => (
                <Link key={a.id} href={`/dashboard/lawyer/knowledge/article?slug=${encodeURIComponent(a.slug)}`}>
                  <Card className="sanson-panel transition hover:border-pink-500/30">
                    <CardContent className="p-4">
                      <p className="text-xs text-pink-300">{a.category?.displayName || "General"}</p>
                      <p className="mt-1 font-medium text-white">{a.title}</p>
                      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{a.summary || a.content}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
