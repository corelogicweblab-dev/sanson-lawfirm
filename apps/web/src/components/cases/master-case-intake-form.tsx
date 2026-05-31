"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Input } from "@sanson/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

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

const SOURCE_TYPES = [
  { value: "MANUAL", label: "Manual entry" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "REFERRAL", label: "Referral" },
  { value: "PHONE_INQUIRY", label: "Phone inquiry" },
  { value: "EMAIL_INQUIRY", label: "Email inquiry" },
  { value: "AI_INTAKE", label: "AI intake" },
  { value: "LEGACY", label: "Legacy migration" },
];

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="sanson-panel">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-white">{title}</span>
        <span className="text-pink-400">{open ? "−" : "+"}</span>
      </button>
      {open && <CardContent className="space-y-3 border-t border-white/10 p-4">{children}</CardContent>}
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-zinc-400">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="sanson-field"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="text-zinc-400">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sanson-field"
      />
    </label>
  );
}

const SOURCE_FROM_QUERY: Record<string, string> = {
  WALK_IN: "WALK_IN",
  PHONE: "PHONE_INQUIRY",
  REFERRAL: "REFERRAL",
  MANUAL: "MANUAL",
};

export function MasterCaseIntakeForm({
  requestId,
  defaultSourceType,
}: {
  requestId?: string | null;
  defaultSourceType?: string | null;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [clientMode, setClientMode] = useState<"new" | "existing">("new");
  const [existingClients, setExistingClients] = useState<Record<string, unknown>[]>([]);
  const [lawyers, setLawyers] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [directoryHint, setDirectoryHint] = useState("");

  const [caseInfo, setCaseInfo] = useState({
    title: "",
    case_category: "CIVIL",
    priority: "MEDIUM",
    source_type: requestId
      ? "AI_INTAKE"
      : SOURCE_FROM_QUERY[defaultSourceType?.toUpperCase() ?? ""] ?? "MANUAL",
    description: "",
    statement_of_facts: "",
    legal_issues: "",
    client_objectives: "",
    requested_action: "",
    special_instructions: "",
  });

  const [client, setClient] = useState({
    client_id: "",
    email: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    phone: "",
    mobile_number: "",
    address: "",
    province: "",
    city: "",
    barangay: "",
    zip: "",
    date_of_birth: "",
    gender: "",
    civil_status: "",
    nationality: "",
    occupation: "",
    employer: "",
    emergency_contact: "",
    emergency_phone: "",
    emergency_relationship: "",
  });

  const [opposing, setOpposing] = useState({
    party_type: "INDIVIDUAL",
    full_name: "",
    contact_phone: "",
    contact_email: "",
    address: "",
    province: "",
    city: "",
    relationship_to_case: "",
    position_in_case: "",
    notes: "",
  });

  const [dates, setDates] = useState({
    incident_date: "",
    discovery_date: "",
    consultation_date: "",
    retention_date: "",
    court_filing_date: "",
    hearing_date: "",
    next_deadline: "",
    follow_up_date: "",
  });

  const [team, setTeam] = useState({ lawyer_id: "", internal_remarks: "" });

  useEffect(() => {
    api.listUserDirectory("CLIENT").then((r) => {
      if (r.success && r.data) {
        setExistingClients(r.data);
        if (r.data.length === 0) {
          setDirectoryHint("No clients in directory yet — use + New client to create one with this case.");
        }
      } else {
        setDirectoryHint("Could not load client list. Use + New client, or refresh after backend deploy.");
      }
    });
    api.listUserDirectory("LAWYER").then((r) => {
      if (r.success && r.data) setLawyers(r.data);
    });
  }, []);

  const submit = async () => {
    setError("");
    if (!caseInfo.title.trim()) {
      setError("Case title is required");
      return;
    }
    if (!client.first_name.trim() || !client.last_name.trim()) {
      setError("Client first and last name are required");
      return;
    }
    if (clientMode === "new" && !client.email.trim()) {
      setError("Email is required for new clients");
      return;
    }
    if (clientMode === "existing" && !client.client_id) {
      setError("Select an existing client or switch to New Client");
      return;
    }

    setLoading(true);
    const payload = {
      title: caseInfo.title,
      case_category: caseInfo.case_category,
      priority: caseInfo.priority,
      source_type: caseInfo.source_type,
      status_name: "DRAFT",
      description: caseInfo.description || caseInfo.statement_of_facts,
      request_id: requestId || undefined,
      assigned_lawyer_id: team.lawyer_id || undefined,
      assigned_paralegal_id: user?.id,
      client: {
        client_id: clientMode === "existing" ? client.client_id : undefined,
        email: clientMode === "new" ? client.email : undefined,
        first_name: client.first_name,
        middle_name: client.middle_name || undefined,
        last_name: client.last_name,
        suffix: client.suffix || undefined,
        phone: client.phone || client.mobile_number || undefined,
        mobile_number: client.mobile_number || undefined,
        address: client.address || undefined,
        details: {
          date_of_birth: client.date_of_birth,
          gender: client.gender,
          civil_status: client.civil_status,
          nationality: client.nationality,
          occupation: client.occupation,
          employer: client.employer,
          province: client.province,
          city: client.city,
          barangay: client.barangay,
          zip: client.zip,
          emergency_contact: client.emergency_contact,
          emergency_phone: client.emergency_phone,
          emergency_relationship: client.emergency_relationship,
        },
      },
      opposing_party: opposing.full_name
        ? {
            ...opposing,
            details: {},
          }
        : undefined,
      case_details: {
        statement_of_facts: caseInfo.statement_of_facts,
        legal_issues: caseInfo.legal_issues,
        client_objectives: caseInfo.client_objectives,
        requested_legal_action: caseInfo.requested_action,
        special_instructions: caseInfo.special_instructions,
      },
      important_dates: dates,
      legal_team: {
        lead_lawyer_id: team.lawyer_id,
        internal_remarks: team.internal_remarks,
      },
      internal_notes: { paralegal_notes: team.internal_remarks },
    };

    const r = await api.createMasterCase(payload);
    setLoading(false);
    if (!r.success || !r.data) {
      setError(r.message || "Failed to create case");
      return;
    }
    const id = (r.data as { id: string }).id;
    router.push(`/dashboard/case?id=${id}&tab=documents`);
  };

  return (
    <div className="space-y-4 pb-24">
      <p className="rounded-lg border border-pink-500/25 bg-pink-950/30 px-4 py-3 text-sm text-zinc-300">
        Case number is auto-generated (e.g. <strong className="text-pink-300">SLF-2026-001</strong>).
        After create, upload documents inside the Case Workspace — nothing is stored outside a case.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setClientMode("new")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            clientMode === "new"
              ? "bg-pink-500 text-white"
              : "border border-white/15 text-zinc-400"
          )}
        >
          + New client
        </button>
        <button
          type="button"
          onClick={() => setClientMode("existing")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            clientMode === "existing"
              ? "bg-pink-500 text-white"
              : "border border-white/15 text-zinc-400"
          )}
        >
          Existing client
        </button>
      </div>

      <Section title="Case information" defaultOpen>
        <Field label="Case title *" value={caseInfo.title} onChange={(v) => setCaseInfo({ ...caseInfo, title: v })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-400">
            Case type
            <select
              className="sanson-field"
              value={caseInfo.case_category}
              onChange={(e) => setCaseInfo({ ...caseInfo, case_category: e.target.value })}
            >
              {CASE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-400">
            Priority
            <select
              className="sanson-field"
              value={caseInfo.priority}
              onChange={(e) => setCaseInfo({ ...caseInfo, priority: e.target.value })}
            >
              {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-400 sm:col-span-2">
            Source type
            <select
              className="sanson-field"
              value={caseInfo.source_type}
              onChange={(e) => setCaseInfo({ ...caseInfo, source_type: e.target.value })}
            >
              {SOURCE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TextArea label="Case description" value={caseInfo.description} onChange={(v) => setCaseInfo({ ...caseInfo, description: v })} />
      </Section>

      <Section title="Client information" defaultOpen>
        {clientMode === "existing" && (
          <label className="block text-sm text-zinc-400">
            Select client (optional — or fill details below)
            <select
              className="sanson-field"
              value={client.client_id}
              onChange={(e) => {
                const id = e.target.value;
                const row = existingClients.find((c) => String(c.id) === id);
                setClient((prev) => ({
                  ...prev,
                  client_id: id,
                  email: String(row?.email ?? prev.email),
                  first_name: String(row?.display_name ?? "").split(" ")[0] || prev.first_name,
                  last_name: String(row?.display_name ?? "").split(" ").slice(1).join(" ") || prev.last_name,
                }));
              }}
            >
              <option value="">— Select existing client —</option>
              {existingClients.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {String(c.display_name)} ({String(c.email)})
                </option>
              ))}
            </select>
          </label>
        )}
        {clientMode === "new" && (
          <Field label="Email address *" value={client.email} onChange={(v) => setClient({ ...client, email: v })} />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name *" value={client.first_name} onChange={(v) => setClient({ ...client, first_name: v })} />
          <Field label="Middle name" value={client.middle_name} onChange={(v) => setClient({ ...client, middle_name: v })} />
          <Field label="Last name *" value={client.last_name} onChange={(v) => setClient({ ...client, last_name: v })} />
          <Field label="Suffix" value={client.suffix} onChange={(v) => setClient({ ...client, suffix: v })} />
          <Field label="Mobile" value={client.mobile_number} onChange={(v) => setClient({ ...client, mobile_number: v })} />
          <Field label="Telephone" value={client.phone} onChange={(v) => setClient({ ...client, phone: v })} />
        </div>
        <TextArea label="Complete address" value={client.address} onChange={(v) => setClient({ ...client, address: v })} rows={2} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Province" value={client.province} onChange={(v) => setClient({ ...client, province: v })} />
          <Field label="City" value={client.city} onChange={(v) => setClient({ ...client, city: v })} />
          <Field label="Barangay" value={client.barangay} onChange={(v) => setClient({ ...client, barangay: v })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date of birth" type="date" value={client.date_of_birth} onChange={(v) => setClient({ ...client, date_of_birth: v })} />
          <Field label="Gender" value={client.gender} onChange={(v) => setClient({ ...client, gender: v })} />
          <Field label="Civil status" value={client.civil_status} onChange={(v) => setClient({ ...client, civil_status: v })} />
          <Field label="Nationality" value={client.nationality} onChange={(v) => setClient({ ...client, nationality: v })} />
          <Field label="Occupation" value={client.occupation} onChange={(v) => setClient({ ...client, occupation: v })} />
          <Field label="Employer" value={client.employer} onChange={(v) => setClient({ ...client, employer: v })} />
        </div>
        <Field label="Emergency contact" value={client.emergency_contact} onChange={(v) => setClient({ ...client, emergency_contact: v })} />
        <Field label="Emergency phone" value={client.emergency_phone} onChange={(v) => setClient({ ...client, emergency_phone: v })} />
      </Section>

      {directoryHint && clientMode === "existing" && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {directoryHint}
        </p>
      )}

      <Section title="Opposing party" defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-400">
            Type
            <select
              className="sanson-field"
              value={opposing.party_type}
              onChange={(e) => setOpposing({ ...opposing, party_type: e.target.value })}
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="ORGANIZATION">Organization</option>
            </select>
          </label>
          <Field label="Full name / company" value={opposing.full_name} onChange={(v) => setOpposing({ ...opposing, full_name: v })} />
        </div>
        <Field label="Contact" value={opposing.contact_phone} onChange={(v) => setOpposing({ ...opposing, contact_phone: v })} />
        <TextArea label="Address" value={opposing.address} onChange={(v) => setOpposing({ ...opposing, address: v })} rows={2} />
        <TextArea label="Notes" value={opposing.notes} onChange={(v) => setOpposing({ ...opposing, notes: v })} />
      </Section>

      <Section title="Case details" defaultOpen>
        <TextArea label="Statement of facts" value={caseInfo.statement_of_facts} onChange={(v) => setCaseInfo({ ...caseInfo, statement_of_facts: v })} rows={4} />
        <TextArea label="Legal issues" value={caseInfo.legal_issues} onChange={(v) => setCaseInfo({ ...caseInfo, legal_issues: v })} />
        <TextArea label="Client objectives" value={caseInfo.client_objectives} onChange={(v) => setCaseInfo({ ...caseInfo, client_objectives: v })} />
        <TextArea label="Requested legal action" value={caseInfo.requested_action} onChange={(v) => setCaseInfo({ ...caseInfo, requested_action: v })} />
        <TextArea label="Special instructions" value={caseInfo.special_instructions} onChange={(v) => setCaseInfo({ ...caseInfo, special_instructions: v })} />
      </Section>

      <Section title="Assigned legal team">
        <label className="block text-sm text-zinc-400">
          Lead lawyer
          <select
            className="sanson-field"
            value={team.lawyer_id}
            onChange={(e) => setTeam({ ...team, lawyer_id: e.target.value })}
          >
            <option value="">Assign later</option>
            {lawyers.map((l) => (
              <option key={String(l.id)} value={String(l.id)}>
                {String(l.display_name)}
              </option>
            ))}
          </select>
        </label>
        <TextArea label="Internal remarks" value={team.internal_remarks} onChange={(v) => setTeam({ ...team, internal_remarks: v })} />
      </Section>

      <Section title="Important dates">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(dates).map(([key, val]) => (
            <Field
              key={key}
              label={key.replace(/_/g, " ")}
              type="date"
              value={val}
              onChange={(v) => setDates({ ...dates, [key]: v })}
            />
          ))}
        </div>
      </Section>

      <Section title="Documents & files (next step)">
        <p className="text-sm text-zinc-400">
          PDF, DOC, images, video, audio, ZIP — upload after case is created in the Case Workspace Documents tab.
        </p>
      </Section>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="sticky bottom-0 z-10 -mx-2 border-t border-white/10 bg-[var(--surface-header)]/95 p-4 backdrop-blur-md">
        <Button loading={loading} onClick={submit} className="w-full sm:w-auto">
          Create draft & open workspace
        </Button>
      </div>
    </div>
  );
}
