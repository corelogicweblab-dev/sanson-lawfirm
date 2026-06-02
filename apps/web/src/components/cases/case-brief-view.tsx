"use client";

/** Read-only legal case brief — structured sections for lawyers and preview. */

const SECTIONS: { key: string; label: string }[] = [
  { key: "statement_of_facts", label: "Statement of facts" },
  { key: "legal_issues", label: "Legal issues" },
  { key: "client_objectives", label: "Client objectives" },
  { key: "requested_legal_action", label: "Requested legal action" },
  { key: "special_instructions", label: "Special instructions" },
];

export function CaseBriefView({
  description,
  caseDetails,
}: {
  description?: string | null;
  caseDetails?: Record<string, unknown> | null;
}) {
  const d = caseDetails ?? {};
  const hasDetails = SECTIONS.some((s) => {
    const v = d[s.key] ?? (s.key === "requested_legal_action" ? d.requested_action : null);
    return v && String(v).trim();
  });

  if (!description?.trim() && !hasDetails) {
    return <p className="text-sm text-zinc-500">No case summary recorded yet.</p>;
  }

  return (
    <div className="space-y-4">
      {description?.trim() && (
        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-black/40 p-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-pink-300">
            Case summary
          </h4>
          <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">{description}</p>
        </section>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((s) => {
          const raw = d[s.key] ?? (s.key === "requested_legal_action" ? d.requested_action : null);
          const text = raw ? String(raw).trim() : "";
          if (!text) return null;
          return (
            <section
              key={s.key}
              className="rounded-xl border border-white/10 bg-black/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <h4 className="mb-2 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-wider text-pink-300/90">
                {s.label}
              </h4>
              <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{text}</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
