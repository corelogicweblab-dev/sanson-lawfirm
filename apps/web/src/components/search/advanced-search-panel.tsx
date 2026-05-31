"use client";

import { GlobalSearch } from "@/components/search/global-search";
import { Card, CardContent } from "@sanson/ui";
import type { SearchMode } from "@sanson/types";
import { useState } from "react";

const SEARCH_TYPES = [
  { id: "case", label: "Cases" },
  { id: "document", label: "Documents" },
  { id: "evidence", label: "Evidence" },
  { id: "knowledge", label: "Knowledge" },
  { id: "summary", label: "AI Summaries" },
] as const;

export function AdvancedSearchPanel() {
  const [mode, setMode] = useState<SearchMode>("HYBRID");
  const [types, setTypes] = useState<string[]>([]);

  const toggleType = (id: string) => {
    setTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const filters = types.length > 0 ? { types } : undefined;

  return (
    <div className="space-y-6">
      <Card className="sanson-panel">
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium text-white">Advanced options</p>
          <div className="mb-4">
            <p className="mb-2 text-xs text-zinc-500">Search mode</p>
            <div className="flex flex-wrap gap-2">
              {(["HYBRID", "SEMANTIC", "KEYWORD", "METADATA"] as SearchMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    mode === m
                      ? "bg-pink-500/20 text-pink-300"
                      : "border border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-zinc-500">Limit to types (optional)</p>
            <div className="flex flex-wrap gap-2">
              {SEARCH_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleType(t.id)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    types.includes(t.id)
                      ? "bg-pink-500/20 text-pink-300"
                      : "border border-white/10 text-zinc-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <GlobalSearch defaultMode={mode} filters={filters} />
    </div>
  );
}
