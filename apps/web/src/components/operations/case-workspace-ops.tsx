"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, Input } from "@sanson/ui";
import type { UserRole } from "@sanson/types";
import { api } from "@/lib/api";

type Props = {
  caseId: string;
  role: UserRole | null;
  onUpdated?: () => void;
};

export function CaseWorkspaceOps({ caseId, role, onUpdated }: Props) {
  const [lawyerId, setLawyerId] = useState("");
  const [lawyers, setLawyers] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    if (role !== "PARALEGAL") return;
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
  }, [role]);
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineDate, setTimelineDate] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await fn();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (role === "LAWYER") {
    return (
      <Card className="border-violet-500/25 bg-violet-950/20">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium text-white">Lawyer review & approval</p>
          <p className="text-xs text-zinc-400">
            Approve to activate the case, or close when the matter is complete. File management is handled by paralegals.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              loading={loading}
              onClick={() =>
                run(async () => {
                  const r = await api.updateCase(caseId, { status_name: "IN_PROGRESS" });
                  if (!r.success) throw new Error(r.message);
                  setMessage("Case approved — now active for legal operations.");
                })
              }
            >
              Approve case
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={loading}
              onClick={() =>
                run(async () => {
                  const r = await api.updateCase(caseId, { status_name: "UNDER_REVIEW" });
                  if (!r.success) throw new Error(r.message);
                  setMessage("Marked under lawyer review.");
                })
              }
            >
              Mark under review
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={loading}
              onClick={() =>
                run(async () => {
                  const r = await api.updateCase(caseId, { status_name: "CLOSED" });
                  if (!r.success) throw new Error(r.message);
                  setMessage("Case closed.");
                })
              }
            >
              Close case
            </Button>
          </div>
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  if (role !== "PARALEGAL") return null;

  return (
    <div className="space-y-4">
      <Card className="border-pink-500/25 bg-pink-950/20">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium text-white">Paralegal operations</p>
          <p className="text-xs text-zinc-400">
            Quick assign — or set the lawyer in Edit case above and Save.
          </p>
          <label className="block text-sm">
            <span className="sanson-label">Lawyer</span>
            <select
              value={lawyerId}
              onChange={(e) => setLawyerId(e.target.value)}
              className="sanson-field mt-1.5 w-full"
            >
              <option value="">Select lawyer…</option>
              {lawyers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="sm"
            loading={loading}
            disabled={!lawyerId.trim()}
            onClick={() =>
              run(async () => {
                const assignee = lawyerId.trim();
                const r = await api.assignCase(caseId, {
                  assignee_id: assignee,
                  assignee_role: "LAWYER",
                });
                if (!r.success) throw new Error(r.message);
                const u = await api.updateCase(caseId, { assigned_lawyer_id: assignee });
                if (!u.success) throw new Error(u.message);
                setMessage("Lawyer assigned.");
              })
            }
          >
            Assign lawyer
          </Button>
        </CardContent>
      </Card>

      <Card className="sanson-panel">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium text-white">Add timeline event</p>
          <Input label="Title" value={timelineTitle} onChange={(e) => setTimelineTitle(e.target.value)} />
          <Input
            label="Date & time (ISO)"
            type="datetime-local"
            value={timelineDate}
            onChange={(e) => setTimelineDate(e.target.value)}
          />
          <Button
            size="sm"
            loading={loading}
            disabled={!timelineTitle.trim() || !timelineDate}
            onClick={() =>
              run(async () => {
                const r = await api.createTimelineEvent(caseId, {
                  title: timelineTitle,
                  event_type: "OTHER",
                  event_date: new Date(timelineDate).toISOString(),
                });
                if (!r.success) throw new Error(r.message);
                setMessage("Timeline event added.");
                setTimelineTitle("");
                setTimelineDate("");
              })
            }
          >
            Save timeline
          </Button>
        </CardContent>
      </Card>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
