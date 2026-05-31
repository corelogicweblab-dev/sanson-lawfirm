"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, History, FileText } from "lucide-react";
import { Card, CardContent, SectionHeader } from "@sanson/ui";
import { api } from "@/lib/api";
import type { SearchHistoryItem, SearchResultItem } from "@sanson/types";

interface RecommendationEntry {
  type: string;
  message?: string;
  caseTitle?: string;
  title?: string;
  relatedDocuments?: SearchResultItem[];
}

export function AiRecommendationsPanel() {
  const [recommendations, setRecommendations] = useState<RecommendationEntry[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    api.getRecommendations().then((r) => {
      if (!r.success || !r.data) return;
      setRecommendations((r.data.recommendations || []) as unknown as RecommendationEntry[]);
      setRecentSearches(
        (r.data.recentSearches || []).map((h, i) => ({
          id: String(i),
          queryText: h.query,
          searchMode: h.mode as SearchHistoryItem["searchMode"],
          createdAt: h.at,
        }))
      );
    });
  }, []);

  if (recommendations.length === 0 && recentSearches.length === 0) return null;

  return (
    <div className="mt-10 space-y-6">
      <SectionHeader
        title="AI Recommendations"
        description="Related documents, pending reviews, and your recent searches."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-pink-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Suggested for you</span>
            </div>
            <ul className="space-y-3">
              {recommendations.slice(0, 5).map((rec, i) => (
                <li key={i} className="text-sm text-zinc-300">
                  <p>{rec.message || rec.caseTitle || rec.title}</p>
                  {rec.relatedDocuments && rec.relatedDocuments.length > 0 && (
                    <ul className="mt-1 space-y-1 pl-2">
                      {rec.relatedDocuments.slice(0, 2).map((doc, j) => (
                        <li key={j}>
                          {doc.openAction ? (
                            <Link href={doc.openAction} className="text-pink-400 hover:underline">
                              {doc.title}
                            </Link>
                          ) : (
                            <span className="text-zinc-500">{doc.title}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {rec.type === "PENDING_REVIEW" && (
                    <FileText className="mt-1 inline h-3 w-3 text-zinc-500" />
                  )}
                </li>
              ))}
            </ul>
            <Link href="/dashboard/lawyer/search" className="mt-4 inline-block text-xs text-pink-400 hover:underline">
              Open Smart Search
            </Link>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-zinc-400">
              <History className="h-4 w-4" />
              <span className="text-sm font-medium">Recent searches</span>
            </div>
            {recentSearches.length === 0 ? (
              <p className="text-sm text-zinc-500">No searches yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentSearches.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={`/dashboard/lawyer/search?q=${encodeURIComponent(h.queryText)}`}
                      className="text-sm text-zinc-300 hover:text-pink-300"
                    >
                      {h.queryText}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
