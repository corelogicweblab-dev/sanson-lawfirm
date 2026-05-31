"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { api } from "@/lib/api";
import { Button, Card, CardContent, PageContainer, SectionHeader } from "@sanson/ui";

type SettingRow = {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
};

export default function ControlCenterPage() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [lockout, setLockout] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.listSystemSettings().then((r) => {
      if (!r.success || !r.data) return;
      const rows = r.data as SettingRow[];
      setSettings(rows);
      const lo = rows.find((s) => s.key === "emergency_lockout");
      const mm = rows.find((s) => s.key === "maintenance_mode");
      if (lo?.value) setLockout(Boolean(lo.value.enabled));
      if (mm?.value) setMaintenance(Boolean(mm.value.enabled));
    });
  }, []);

  const saveSetting = async (key: string, value: Record<string, unknown>) => {
    setSaving(true);
    await api.updateSystemSetting(key, value);
    setSaving(false);
    const r = await api.listSystemSettings();
    if (r.success && r.data) setSettings(r.data as SettingRow[]);
  };

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

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Card className="sanson-panel">
              <CardContent className="p-6">
                <h3 className="mb-2 font-semibold text-white">Maintenance Mode</h3>
                <p className="mb-4 text-sm text-zinc-400">
                  Blocks non-health API traffic with a service-unavailable response.
                </p>
                <Button
                  disabled={saving}
                  onClick={() => {
                    const next = !maintenance;
                    setMaintenance(next);
                    saveSetting("maintenance_mode", {
                      enabled: next,
                      message: "Scheduled maintenance in progress",
                    });
                  }}
                >
                  {maintenance ? "Disable Maintenance" : "Enable Maintenance"}
                </Button>
              </CardContent>
            </Card>

            <Card className="sanson-panel">
              <CardContent className="p-6">
                <h3 className="mb-2 font-semibold text-white">Emergency Lockout</h3>
                <p className="mb-4 text-sm text-zinc-400">
                  Restricts platform access during a security incident.
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
