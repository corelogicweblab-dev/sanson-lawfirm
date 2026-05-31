"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import type { KnowledgeArticleItem } from "@sanson/types";
import { Card, CardContent, PageContainer } from "@sanson/ui";

function ArticleContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";
  const [article, setArticle] = useState<KnowledgeArticleItem | null>(null);

  useEffect(() => {
    if (slug) api.getKnowledgeArticle(slug).then((r) => r.success && r.data && setArticle(r.data));
  }, [slug]);

  if (!slug) {
    return <p className="text-zinc-500">No article selected.</p>;
  }

  return (
    article && (
      <Card className="border-white/10 bg-white/5">
        <CardContent className="prose prose-invert max-w-none p-8">
          <p className="text-sm text-zinc-500">{article.category?.displayName}</p>
          <h1 className="text-2xl font-bold text-white">{article.title}</h1>
          {article.summary && <p className="text-zinc-300">{article.summary}</p>}
          <div className="mt-6 whitespace-pre-wrap text-zinc-200">{article.content}</div>
        </CardContent>
      </Card>
    )
  );
}

export default function KnowledgeArticlePage() {
  return (
    <AuthGuard allowedRoles={["LAWYER", "PARALEGAL", "ADMIN", "CLIENT"]}>
      <DashboardShell
        title="Article"
        breadcrumbs={[
          { label: "Knowledge", href: "/dashboard/lawyer/knowledge" },
          { label: "Article" },
        ]}
      >
        <PageContainer>
          <Suspense fallback={<p className="text-zinc-500">Loading article…</p>}>
            <ArticleContent />
          </Suspense>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
