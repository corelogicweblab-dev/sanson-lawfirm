"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input } from "@sanson/ui";
import type { UserRole } from "@sanson/types";
import { api } from "@/lib/api";

type Props = {
  caseId: string;
  role: UserRole | null;
  onUpdated?: () => void;
};

export function CaseWorkspaceOps({ caseId, role, onUpdated }: Props) {
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
