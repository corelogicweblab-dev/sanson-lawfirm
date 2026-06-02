"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, Input } from "@sanson/ui";
import type { CaseItem } from "@sanson/types";
import { api } from "@/lib/api";

const CASE_TYPES = [
  "CIVIL",
  "CRIMINAL",
  "LABOR",
  "FAMILY",
  "ADMINISTRATIVE",
  "CYBERCRIME",
  "PROPERTY",
  "CORPORATE",
  "IMMIGRATION",
  "TAX",
  "OTHER",
] as const;

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const PARALEGAL_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "WAITING_DOCUMENTS", label: "Waiting documents" },
  { value: "UNDER_REVIEW", label: "Under lawyer review" },
] as const;

function FieldTextArea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="sanson-label">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sanson-field mt-1.5 w-full"
      />
    </label>
  );
}

type Props = {
  caseItem: CaseItem;
  caseId: string;
  onSaved: () => void;
};

export function ParalegalCaseEditor({ caseItem, caseId, onSaved }: Props) {
  const master = (caseItem.master_data || {}) as Record<string, unknown>;
  const details = (master.case_details || {}) as Record<string, string>;
  const notes = (master.internal_notes || {}) as Record<string, string>;

  const [title, setTitle] = useState(caseItem.title);
  const [description, setDescription] = useState(caseItem.description ?? "");
  const [caseCategory, setCaseCategory] = useState(caseItem.case_category);
  const [priority, setPriority] = useState(caseItem.priority);
  const [statusName, setStatusName] = useState(caseItem.status?.name ?? "DRAFT");
  const [lawyerId, setLawyerId] = useState(caseItem.assigned_lawyer_id ?? "");
  const [lawyers, setLawyers] = useState<{ id: string; label: string }[]>([]);
  const [statementOfFacts, setStatementOfFacts] = useState(details.statement_of_facts ?? "");
  const [legalIssues, setLegalIssues] = useState(details.legal_issues ?? "");
  const [clientObjectives, setClientObjectives] = useState(details.client_objectives ?? "");
  const [requestedAction, setRequestedAction] = useState(
    details.requested_legal_action ?? details.requested_action ?? ""
  );
  const [specialInstructions, setSpecialInstructions] = useState(details.special_instructions ?? "");
  const [paralegalNotes, setParalegalNotes] = useState(notes.paralegal_notes ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const m = (caseItem.master_data || {}) as Record<string, unknown>;
    const d = (m.case_details || {}) as Record<string, string>;
    const n = (m.internal_notes || {}) as Record<string, string>;
    setTitle(caseItem.title);
    setDescription(caseItem.description ?? "");
    setCaseCategory(caseItem.case_category);
    setPriority(caseItem.priority);
    setStatusName(caseItem.status?.name ?? "DRAFT");
    setLawyerId(caseItem.assigned_lawyer_id ?? "");
    setStatementOfFacts(d.statement_of_facts ?? "");
    setLegalIssues(d.legal_issues ?? "");
    setClientObjectives(d.client_objectives ?? "");
    setRequestedAction(d.requested_legal_action ?? d.requested_action ?? "");
    setSpecialInstructions(d.special_instructions ?? "");
    setParalegalNotes(n.paralegal_notes ?? "");
  }, [caseItem]);

  useEffect(() => {
    api.listUserDirectory("LAWYER").then((r) => {
      if (r.success && r.data) {
        setLawyers(
          r.data.map((u) => ({
            id: String(u.id),
            label: String(u.display_name ?? u.email ?? u.id),
          }))
        );
      }
    });
  }, []);

  const save = async () => {
    setError("");
    setMessage("");
    if (!title.trim()) {
      setError("Case title is required.");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        case_category: caseCategory,
        priority,
        status_name: statusName,
        master_data: {
          case_details: {
            statement_of_facts: statementOfFacts,
            legal_issues: legalIssues,
            client_objectives: clientObjectives,
            requested_legal_action: requestedAction,
            special_instructions: specialInstructions,
          },
          internal_notes: { paralegal_notes: paralegalNotes },
        },
      };
      if (lawyerId) payload.assigned_lawyer_id = lawyerId;

      const r = await api.updateCase(caseId, payload);
      if (!r.success) throw new Error(r.message || "Could not save case");
      setMessage("Case saved.");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save case");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-pink-500/30 bg-pink-950/15">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-white">Edit case</p>
          <Button size="sm" loading={loading} onClick={() => void save()}>
            Save changes
          </Button>
        </div>

        <Input label="Case title" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="sanson-label">Case type</span>
            <select
              value={caseCategory}
              onChange={(e) => setCaseCategory(e.target.value)}
              className="sanson-field mt-1.5 w-full"
            >
              {CASE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="sanson-label">Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="sanson-field mt-1.5 w-full"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="sanson-label">Status</span>
            <select
              value={statusName}
              onChange={(e) => setStatusName(e.target.value)}
              className="sanson-field mt-1.5 w-full"
            >
              {PARALEGAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <span className="sanson-label">Assigned lawyer</span>
          <select
            value={lawyerId}
            onChange={(e) => setLawyerId(e.target.value)}
            className="sanson-field mt-1.5 w-full"
          >
            <option value="">— Not assigned —</option>
            {lawyers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <FieldTextArea label="Summary / description" value={description} onChange={setDescription} rows={3} />
        <FieldTextArea label="Statement of facts" value={statementOfFacts} onChange={setStatementOfFacts} />
        <FieldTextArea label="Legal issues" value={legalIssues} onChange={setLegalIssues} rows={3} />
        <FieldTextArea label="Client objectives" value={clientObjectives} onChange={setClientObjectives} rows={3} />
        <FieldTextArea label="Requested legal action" value={requestedAction} onChange={setRequestedAction} rows={3} />
        <FieldTextArea
          label="Special instructions"
          value={specialInstructions}
          onChange={setSpecialInstructions}
          rows={3}
        />
        <FieldTextArea label="Paralegal notes (internal)" value={paralegalNotes} onChange={setParalegalNotes} rows={3} />

        {message && <p className="text-sm text-emerald-300">{message}</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}
      </CardContent>
    </Card>
  );
}
