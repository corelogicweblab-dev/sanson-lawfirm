"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, Input } from "@sanson/ui";
import type { CaseItem } from "@sanson/types";
import { api } from "@/lib/api";
import type { CaseWorkspaceTab } from "@/components/cases/case-workspace-tabs";

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
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="sanson-label">{label}</span>
      {hint && <span className="ml-2 text-xs text-zinc-500">{hint}</span>}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sanson-field mt-1.5 w-full"
      />
    </label>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-950/20 to-black/30 p-4 sm:p-5">
      <h4 className="mb-4 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-wider text-pink-300">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

type Props = {
  caseItem: CaseItem;
  caseId: string;
  activeTab: CaseWorkspaceTab;
  onSaved: () => void;
};

function loadFormFromCase(caseItem: CaseItem) {
  const master = (caseItem.master_data || {}) as Record<string, unknown>;
  const details = (master.case_details || {}) as Record<string, string>;
  const notes = (master.internal_notes || {}) as Record<string, string>;
  const snap = (master.client_snapshot || {}) as Record<string, unknown>;
  const snapDetails = (snap.details || {}) as Record<string, string>;
  const dates = (master.important_dates || {}) as Record<string, string>;
  const party = caseItem.parties?.[0] as Record<string, unknown> | undefined;
  const opMaster = (master.opposing_party || {}) as Record<string, string>;

  return {
    title: caseItem.title,
    description: caseItem.description ?? "",
    caseCategory: caseItem.case_category,
    priority: caseItem.priority,
    statusName: caseItem.status?.name ?? "DRAFT",
    lawyerId: caseItem.assigned_lawyer_id ?? "",
    statementOfFacts: details.statement_of_facts ?? "",
    legalIssues: details.legal_issues ?? "",
    clientObjectives: details.client_objectives ?? "",
    requestedAction: details.requested_legal_action ?? details.requested_action ?? "",
    specialInstructions: details.special_instructions ?? "",
    paralegalNotes: notes.paralegal_notes ?? "",
    clientEmail: String(snap.email ?? ""),
    clientFirst: String(snap.first_name ?? ""),
    clientMiddle: String(snap.middle_name ?? ""),
    clientLast: String(snap.last_name ?? ""),
    clientSuffix: String(snap.suffix ?? ""),
    clientPhone: String(snap.phone ?? snap.mobile_number ?? ""),
    clientMobile: String(snap.mobile_number ?? ""),
    clientAddress: String(snap.address ?? ""),
    clientDob: String(snapDetails.date_of_birth ?? ""),
    clientGender: String(snapDetails.gender ?? ""),
    clientCivil: String(snapDetails.civil_status ?? ""),
    clientOccupation: String(snapDetails.occupation ?? ""),
    clientEmergency: String(snapDetails.emergency_contact ?? ""),
    clientEmergencyPhone: String(snapDetails.emergency_phone ?? ""),
    opposingName: String(party?.full_name ?? opMaster.full_name ?? ""),
    opposingPhone: String(party?.contact_phone ?? opMaster.contact_phone ?? ""),
    opposingEmail: String(party?.contact_email ?? opMaster.contact_email ?? ""),
    opposingAddress: String(party?.address ?? opMaster.address ?? ""),
    opposingNotes: String(party?.notes ?? opMaster.notes ?? ""),
    incidentDate: dates.incident_date ?? "",
    consultationDate: dates.consultation_date ?? "",
    hearingDate: dates.hearing_date ?? "",
    nextDeadline: dates.next_deadline ?? "",
  };
}

export function ParalegalCaseWorkspace({ caseItem, caseId, activeTab, onSaved }: Props) {
  const [form, setForm] = useState(() => loadFormFromCase(caseItem));
  const [lawyers, setLawyers] = useState<{ id: string; label: string }[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(loadFormFromCase(caseItem));
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

  const patch = (partial: Partial<ReturnType<typeof loadFormFromCase>>) =>
    setForm((f) => ({ ...f, ...partial }));

  const save = async () => {
    setError("");
    setMessage("");
    if (!form.title.trim()) {
      setError("Case title is required.");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        case_category: form.caseCategory,
        priority: form.priority,
        status_name: form.statusName,
        master_data: {
          case_details: {
            statement_of_facts: form.statementOfFacts,
            legal_issues: form.legalIssues,
            client_objectives: form.clientObjectives,
            requested_legal_action: form.requestedAction,
            special_instructions: form.specialInstructions,
          },
          client_snapshot: {
            email: form.clientEmail,
            first_name: form.clientFirst,
            middle_name: form.clientMiddle || undefined,
            last_name: form.clientLast,
            suffix: form.clientSuffix || undefined,
            phone: form.clientPhone || undefined,
            mobile_number: form.clientMobile || undefined,
            address: form.clientAddress || undefined,
            details: {
              date_of_birth: form.clientDob || undefined,
              gender: form.clientGender || undefined,
              civil_status: form.clientCivil || undefined,
              occupation: form.clientOccupation || undefined,
              emergency_contact: form.clientEmergency || undefined,
              emergency_phone: form.clientEmergencyPhone || undefined,
            },
          },
          opposing_party: {
            full_name: form.opposingName,
            contact_phone: form.opposingPhone,
            contact_email: form.opposingEmail,
            address: form.opposingAddress,
            notes: form.opposingNotes,
          },
          important_dates: {
            incident_date: form.incidentDate,
            consultation_date: form.consultationDate,
            hearing_date: form.hearingDate,
            next_deadline: form.nextDeadline,
          },
          internal_notes: { paralegal_notes: form.paralegalNotes },
        },
      };
      if (form.lawyerId) payload.assigned_lawyer_id = form.lawyerId;

      const r = await api.updateCase(caseId, payload);
      if (!r.success) throw new Error(r.message || "Could not save");
      setMessage("All changes saved.");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setLoading(false);
    }
  };

  const showCore = activeTab === "overview";
  const showClient = activeTab === "client" || activeTab === "overview";
  const showOpposing = activeTab === "opposing" || activeTab === "overview";
  const showDates = activeTab === "timeline" || activeTab === "overview";
  const showNotes = activeTab === "notes" || activeTab === "overview";

  return (
    <div className="space-y-4">
      <Card className="sticky top-0 z-10 border-pink-500/40 bg-zinc-950/95 shadow-lg backdrop-blur">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-white">Paralegal case workspace</p>
            <p className="text-xs text-zinc-400">Edit any section below, then save — changes apply to the whole case.</p>
          </div>
          <Button loading={loading} onClick={() => void save()}>
            Save all changes
          </Button>
        </CardContent>
      </Card>

      {showCore && (
        <>
          <SectionCard title="Case file">
            <Input
              label="Case title"
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="sanson-label">Case type</span>
                <select
                  value={form.caseCategory}
                  onChange={(e) => patch({ caseCategory: e.target.value })}
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
                  value={form.priority}
                  onChange={(e) => patch({ priority: e.target.value })}
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
                  value={form.statusName}
                  onChange={(e) => patch({ statusName: e.target.value })}
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
                value={form.lawyerId}
                onChange={(e) => patch({ lawyerId: e.target.value })}
                className="sanson-field mt-1.5 w-full"
              >
                <option value="">— Select lawyer —</option>
                {lawyers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </SectionCard>

          <SectionCard title="Legal case brief">
            <FieldTextArea
              label="Executive summary"
              value={form.description}
              onChange={(v) => patch({ description: v })}
              rows={3}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <FieldTextArea
                label="Statement of facts"
                value={form.statementOfFacts}
                onChange={(v) => patch({ statementOfFacts: v })}
              />
              <FieldTextArea
                label="Legal issues"
                value={form.legalIssues}
                onChange={(v) => patch({ legalIssues: v })}
                rows={5}
              />
              <FieldTextArea
                label="Client objectives"
                value={form.clientObjectives}
                onChange={(v) => patch({ clientObjectives: v })}
                rows={4}
              />
              <FieldTextArea
                label="Requested legal action"
                value={form.requestedAction}
                onChange={(v) => patch({ requestedAction: v })}
                rows={4}
              />
            </div>
            <FieldTextArea
              label="Special instructions"
              value={form.specialInstructions}
              onChange={(v) => patch({ specialInstructions: v })}
              rows={3}
            />
          </SectionCard>
        </>
      )}

      {showClient && (
        <SectionCard title="Client information">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Email" value={form.clientEmail} onChange={(e) => patch({ clientEmail: e.target.value })} />
            <Input label="Phone" value={form.clientPhone} onChange={(e) => patch({ clientPhone: e.target.value })} />
            <Input
              label="First name"
              value={form.clientFirst}
              onChange={(e) => patch({ clientFirst: e.target.value })}
            />
            <Input
              label="Last name"
              value={form.clientLast}
              onChange={(e) => patch({ clientLast: e.target.value })}
            />
            <Input
              label="Middle name"
              value={form.clientMiddle}
              onChange={(e) => patch({ clientMiddle: e.target.value })}
            />
            <Input label="Suffix" value={form.clientSuffix} onChange={(e) => patch({ clientSuffix: e.target.value })} />
            <Input
              label="Mobile"
              value={form.clientMobile}
              onChange={(e) => patch({ clientMobile: e.target.value })}
            />
            <Input
              label="Date of birth"
              value={form.clientDob}
              onChange={(e) => patch({ clientDob: e.target.value })}
            />
            <Input label="Gender" value={form.clientGender} onChange={(e) => patch({ clientGender: e.target.value })} />
            <Input
              label="Civil status"
              value={form.clientCivil}
              onChange={(e) => patch({ clientCivil: e.target.value })}
            />
            <Input
              label="Occupation"
              value={form.clientOccupation}
              onChange={(e) => patch({ clientOccupation: e.target.value })}
            />
          </div>
          <Input
            label="Address"
            value={form.clientAddress}
            onChange={(e) => patch({ clientAddress: e.target.value })}
          />
          <Input
            label="Emergency contact"
            value={form.clientEmergency}
            onChange={(e) => patch({ clientEmergency: e.target.value })}
          />
          <Input
            label="Emergency phone"
            value={form.clientEmergencyPhone}
            onChange={(e) => patch({ clientEmergencyPhone: e.target.value })}
          />
        </SectionCard>
      )}

      {showOpposing && (
        <SectionCard title="Opposing party">
          <Input
            label="Full name"
            value={form.opposingName}
            onChange={(e) => patch({ opposingName: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Phone"
              value={form.opposingPhone}
              onChange={(e) => patch({ opposingPhone: e.target.value })}
            />
            <Input
              label="Email"
              value={form.opposingEmail}
              onChange={(e) => patch({ opposingEmail: e.target.value })}
            />
          </div>
          <Input
            label="Address"
            value={form.opposingAddress}
            onChange={(e) => patch({ opposingAddress: e.target.value })}
          />
          <FieldTextArea label="Notes" value={form.opposingNotes} onChange={(v) => patch({ opposingNotes: v })} rows={3} />
        </SectionCard>
      )}

      {showDates && (
        <SectionCard title="Important dates">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Incident date"
              type="date"
              value={form.incidentDate?.slice(0, 10) ?? ""}
              onChange={(e) => patch({ incidentDate: e.target.value })}
            />
            <Input
              label="Consultation date"
              type="date"
              value={form.consultationDate?.slice(0, 10) ?? ""}
              onChange={(e) => patch({ consultationDate: e.target.value })}
            />
            <Input
              label="Hearing date"
              type="date"
              value={form.hearingDate?.slice(0, 10) ?? ""}
              onChange={(e) => patch({ hearingDate: e.target.value })}
            />
            <Input
              label="Next deadline"
              type="date"
              value={form.nextDeadline?.slice(0, 10) ?? ""}
              onChange={(e) => patch({ nextDeadline: e.target.value })}
            />
          </div>
        </SectionCard>
      )}

      {showNotes && (
        <SectionCard title="Internal notes">
          <FieldTextArea
            label="Paralegal notes (confidential)"
            value={form.paralegalNotes}
            onChange={(v) => patch({ paralegalNotes: v })}
            rows={5}
          />
        </SectionCard>
      )}

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
      )}
    </div>
  );
}
