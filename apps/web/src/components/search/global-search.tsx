"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Loader2, Sparkles, History, X } from "lucide-react";
import { Button, Card, CardContent, Badge } from "@sanson/ui";
import type { SearchResultItem, SearchMode } from "@sanson/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  document: "bg-blue-500/20 text-blue-200",
  case: "bg-pink-500/20 text-pink-200",
  evidence: "bg-violet-500/20 text-violet-200",
  knowledge: "bg-amber-500/20 text-amber-200",
  summary: "bg-emerald-500/20 text-emerald-200",
};

interface GlobalSearchProps {
  defaultMode?: SearchMode;
  compact?: boolean;
  filters?: Record<string, unknown>;
}

export function GlobalSearch({
  defaultMode = "HYBRID",
  compact = false,
  filters,
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>(defaultMode);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    api.getSearchHistory().then((r) => {
      if (r.success && r.data) {
        setHistory(r.data.map((h) => h.queryText).slice(0, 5));
      }
    });
  }, []);

  const runSearch = useCallback(async (q?: string) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setLoading(true);
    setSearched(true);
    const res = await api.search(text, mode, 20, filters);
    if (res.success && res.data) setResults(res.data);
    setLoading(false);
  }, [query, mode]);

  return (
    <div className={cn("space-y-4", compact ? "" : "max-w-3xl")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder='Try: "illegal dismissal"'
            className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-base text-white placeholder:text-zinc-500 focus:border-pink-500/50 focus:outline-none sm:text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SearchMode)}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white sm:flex-none sm:py-0"
          >
            <option value="HYBRID">Hybrid</option>
            <option value="SEMANTIC">Semantic</option>
            <option value="KEYWORD">Keyword</option>
            <option value="METADATA">Metadata</option>
          </select>
          <Button onClick={() => runSearch()} disabled={loading} className="shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {history.length > 0 && !searched && (
        <div className="flex flex-wrap items-center gap-2">
          <History className="h-4 w-4 text-zinc-500" />
          {history.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                setQuery(h);
                runSearch(h);
              }}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 hover:border-pink-500/30 hover:text-pink-200"
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-sm text-zinc-500">Searching across documents, cases, evidence, and knowledge…</p>
      )}

      {searched && !loading && results.length === 0 && (
        <p className="text-sm text-zinc-500">No results. Try different wording or keyword mode.</p>
      )}

      <div className="space-y-3">
        {results.map((r, i) => (
          <Card key={`${r.type}-${r.sourceId}-${i}`} className="sanson-panel">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={TYPE_COLORS[r.type] || "bg-zinc-500/20"}>{r.type}</Badge>
                    <span className="text-xs text-zinc-500">
                      {Math.round(r.rankingScore)}% match
                    </span>
                  </div>
                  <p className="mt-1 font-medium text-white">{r.title}</p>
                  {r.summary && <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{r.summary}</p>}
                </div>
                {r.openAction && (
                  <Link href={r.openAction} className="text-xs text-pink-400 hover:underline shrink-0">
                    Open
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-start sm:p-4 sm:pt-16">
      <Card className="max-h-[92dvh] w-full overflow-hidden rounded-t-2xl border-white/10 bg-zinc-900/98 sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl">
        <CardContent className="overflow-y-auto p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Smart Search</h2>
            <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <GlobalSearch compact />
        </CardContent>
      </Card>
    </div>
  );
}
