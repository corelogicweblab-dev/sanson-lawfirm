"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import { Button, Card, CardContent, Input, PageContainer, SectionHeader } from "@sanson/ui";

type SettingRow = {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
};

/** ISO string -> value for <input type="datetime-local"> (local time). */
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

/** datetime-local value -> ISO string with timezone. */
function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function fmtWindow(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ControlCenterPage() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [lockout, setLockout] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [maintMessage, setMaintMessage] = useState("Scheduled maintenance in progress");
  const [maintStart, setMaintStart] = useState("");
  const [maintEnd, setMaintEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const hydrateMaintenance = (rows: SettingRow[]) => {
    const mm = rows.find((s) => s.key === "maintenance_mode");
    if (mm?.value) {
      setMaintenance(Boolean(mm.value.enabled));
      setMaintMessage(
        (mm.value.message as string) || "Scheduled maintenance in progress"
      );
      setMaintStart(isoToLocalInput(mm.value.scheduled_start as string | null));
      setMaintEnd(isoToLocalInput(mm.value.scheduled_end as string | null));
    }
  };

  useEffect(() => {
    api.listSystemSettings().then((r) => {
      if (!r.success || !r.data) return;
      const rows = r.data as SettingRow[];
      setSettings(rows);
      const lo = rows.find((s) => s.key === "emergency_lockout");
      if (lo?.value) setLockout(Boolean(lo.value.enabled));
      hydrateMaintenance(rows);
    });
  }, []);

  const saveSetting = async (key: string, value: Record<string, unknown>) => {
    setSaving(true);
    await api.updateSystemSetting(key, value);
    setSaving(false);
    const r = await api.listSystemSettings();
    if (r.success && r.data) {
      setSettings(r.data as SettingRow[]);
      if (key === "maintenance_mode") hydrateMaintenance(r.data as SettingRow[]);
    }
  };

  const saveMaintenance = (enabled: boolean) =>
    saveSetting("maintenance_mode", {
      enabled,
      message: maintMessage || "Scheduled maintenance in progress",
      scheduled_start: localInputToIso(maintStart),
      scheduled_end: localInputToIso(maintEnd),
    });

  const flags = settings.find((s) => s.key === "feature_flags")?.value ?? {};

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <DashboardShell
        title="Control Center"
        breadcrumbs={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Control Center" }]}
      >
        <PageContainer>
          <SectionHeader
            title="Admin Control Center"
            description="Maintenance mode, emergency lockout, and feature toggles."
          />

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card className="sanson-panel">
              <CardContent className="space-y-4 p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">Scheduled Maintenance</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        maintenance
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {maintenance ? "Scheduled" : "Off"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    Blocks normal users during the window below. Admins always keep full access and
                    can lift it anytime.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="sanson-label">Start (optional)</span>
                    <input
                      type="datetime-local"
                      value={maintStart}
                      onChange={(e) => setMaintStart(e.target.value)}
                      className="sanson-field mt-1.5 w-full"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="sanson-label">End / auto-lift (optional)</span>
                    <input
                      type="datetime-local"
                      value={maintEnd}
                      onChange={(e) => setMaintEnd(e.target.value)}
                      className="sanson-field mt-1.5 w-full"
                    />
                  </label>
                </div>

                <Input
                  label="Notice shown to users"
                  value={maintMessage}
                  onChange={(e) => setMaintMessage(e.target.value)}
                />

                {maintenance && (
                  <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    Window: {fmtWindow(maintStart ? localInputToIso(maintStart) : null)} →{" "}
                    {fmtWindow(maintEnd ? localInputToIso(maintEnd) : null)}
                    {!maintStart && !maintEnd ? " (active immediately, no auto-lift)" : ""}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={saving}
                    onClick={() => {
                      setMaintenance(true);
                      void saveMaintenance(true);
                    }}
                  >
                    {maintenance ? "Update Schedule" : "Schedule Maintenance"}
                  </Button>
                  {maintenance && (
                    <Button
                      variant="outline"
                      disabled={saving}
                      onClick={() => {
                        setMaintenance(false);
                        void saveMaintenance(false);
                      }}
                    >
                      Lift Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="sanson-panel">
              <CardContent className="p-6">
                <h3 className="mb-2 font-semibold text-white">Emergency Lockout</h3>
                <p className="mb-4 text-sm text-zinc-400">
                  Restricts platform access during a security incident. Admins keep access to lift
                  it.
                </p>
                <Button
                  variant={lockout ? "default" : "outline"}
                  disabled={saving}
                  onClick={async () => {
                    const next = !lockout;
                    setLockout(next);
                    await api.setEmergencyLockout(next, next ? "Admin initiated" : undefined);
                    await saveSetting("emergency_lockout", { enabled: next, reason: null });
                  }}
                >
                  {lockout ? "Disable Lockout" : "Enable Lockout"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="sanson-panel">
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold text-white">Feature Flags</h3>
              <ul className="space-y-3">
                {Object.entries(flags as Record<string, boolean>).map(([key, on]) => (
                  <li key={key} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                    <span className="text-sm text-zinc-300">{key}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => {
                        const next = { ...(flags as Record<string, boolean>), [key]: !on };
                        saveSetting("feature_flags", next);
                      }}
                    >
                      {on ? "On" : "Off"}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </PageContainer>
      </DashboardShell>
    </AuthGuard>
  );
}
