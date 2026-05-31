import { AlertTriangle } from "lucide-react";

export function LegalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/90"
          : "rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 to-pink-500/5 px-4 py-3 backdrop-blur-md"
      }
    >
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p className={compact ? "text-xs leading-relaxed" : "text-sm leading-relaxed text-zinc-200"}>
          The AI Legal Assistant provides informational and intake assistance only. AI responses
          do not constitute legal advice. Final legal assessment and representation decisions remain
          the responsibility of licensed lawyers of SANSON Law Firm.
        </p>
      </div>
    </div>
  );
}
