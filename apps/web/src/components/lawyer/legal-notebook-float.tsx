"use client";

import { useEffect, useState } from "react";
import { BookOpen, X, Pin } from "lucide-react";
import { Button } from "@sanson/ui";
import { LAWYER_NOTEBOOK_CATEGORIES } from "@sanson/shared";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "sanson-legal-notebook-";

type NotebookCategory = (typeof LAWYER_NOTEBOOK_CATEGORIES)[number];

type Props = {
  caseId: string;
  caseNumber?: string;
};

export function LegalNotebookFloat({ caseId, caseNumber }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<NotebookCategory>(LAWYER_NOTEBOOK_CATEGORIES[0]);
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);

  const storageKey = `${STORAGE_PREFIX}${caseId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { body?: string; category?: string; pinned?: boolean };
        if (parsed.body) setBody(parsed.body);
        if (
          parsed.category &&
          (LAWYER_NOTEBOOK_CATEGORIES as readonly string[]).includes(parsed.category)
        ) {
          setCategory(parsed.category as NotebookCategory);
        }
        if (parsed.pinned) setPinned(parsed.pinned);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ body, category, pinned, updatedAt: new Date().toISOString() })
        );
      } catch {
        /* ignore */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [body, category, pinned, storageKey]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-pink-500/40 bg-black/85 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md",
          open && "ring-2 ring-pink-500/50"
        )}
        title="Legal notebook"
      >
        <BookOpen className="h-4 w-4 text-pink-300" />
        Legal notebook
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col rounded-2xl border border-pink-500/30 bg-black/92 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Legal notebook</p>
              <p className="text-xs text-zinc-400">{caseNumber ?? caseId} · Private to lawyer</p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={cn("rounded p-1", pinned ? "text-pink-400" : "text-zinc-500")}
                aria-label="Pin note"
              >
                <Pin className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-3">
            <label className="sanson-label">Category</label>
            <select
              className="sanson-field mb-2"
              value={category}
              onChange={(e) => setCategory(e.target.value as NotebookCategory)}
            >
              {LAWYER_NOTEBOOK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <textarea
              className="sanson-field min-h-[140px]"
              placeholder="Strategy, court prep, settlement notes… Auto-saves locally."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <p className="mt-2 text-[10px] text-zinc-500">
              Optional: share with paralegal via case notes tab (team sync coming soon).
            </p>
            <Button size="sm" className="mt-2 w-full" variant="secondary" onClick={() => setOpen(false)}>
              Close & continue review
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
