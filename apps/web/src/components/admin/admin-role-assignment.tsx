"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sanson/ui";
import { ROLE_DISPLAY } from "@sanson/shared";
import type { User, UserRole } from "@sanson/types";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const ASSIGNABLE_ROLES: { value: UserRole; hint: string }[] = [
  { value: "LAWYER", hint: "Legal review, approvals, case closure" },
  { value: "PARALEGAL", hint: "Intake, documents, calendar, case preparation" },
  { value: "CLIENT", hint: "Client portal access only" },
  { value: "ADMIN", hint: "Platform administration (no legal operations)" },
];

function displayName(u: User): string {
  const p = u.profile;
  if (p) {
    const n = [p.first_name, p.last_name].filter(Boolean).join(" ");
    if (n) return n;
  }
  return u.email;
}

export function AdminRoleAssignment() {
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await api.listUsers(1, 100);
    if (r.success && r.data) setUsers(r.data);
    else setError(r.message ?? "Could not load users");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setRole = async (user: User, role: UserRole) => {
    if (user.role?.name === role) return;
    if (user.id === me?.id && role !== "ADMIN") {
      setError("You cannot remove your own administrator access here.");
      return;
    }
    const label = ROLE_DISPLAY[role] ?? role;
    if (
      !window.confirm(
        `Set ${displayName(user)} (${user.email}) to ${label}? They will sign in with that dashboard on next login.`
      )
    ) {
      return;
    }
    setSavingId(user.id);
    setError("");
    setMessage("");
    const r = await api.updateUserRole(user.id, role);
    setSavingId(null);
    if (!r.success) {
      setError(r.message ?? "Could not update role");
      return;
    }
    setMessage(`${displayName(user)} is now ${label}.`);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {ASSIGNABLE_ROLES.filter((r) => r.value === "LAWYER" || r.value === "PARALEGAL").map((r) => (
          <Card key={r.value} className="border-pink-500/20 bg-pink-950/10">
            <CardContent className="p-4">
              <p className="font-medium text-white">{ROLE_DISPLAY[r.value]}</p>
              <p className="mt-1 text-xs text-zinc-400">{r.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-zinc-400">
        Only administrators can assign firm roles. Choose <strong className="text-zinc-200">Lawyer</strong> or{" "}
        <strong className="text-zinc-200">Paralegal</strong> for each staff member below.
      </p>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Loading users…</p>
      ) : users.length === 0 ? (
        <EmptyState title="No users" description="Register staff first, then assign roles here." />
      ) : (
        <Card className="sanson-panel overflow-x-auto">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current role</TableHead>
                  <TableHead>Set role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-white">{displayName(u)}</TableCell>
                    <TableCell className="text-zinc-400">{u.email}</TableCell>
                    <TableCell>
                      <Badge>{ROLE_DISPLAY[u.role?.name as UserRole] ?? u.role?.name ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <select
                        className="sanson-field min-w-[10rem]"
                        value={u.role?.name ?? "CLIENT"}
                        disabled={savingId === u.id}
                        onChange={(e) => void setRole(u, e.target.value as UserRole)}
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {ROLE_DISPLAY[r.value]}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
