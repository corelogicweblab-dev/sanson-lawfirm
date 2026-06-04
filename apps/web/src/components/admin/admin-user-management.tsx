"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
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

const ROLES: UserRole[] = ["CLIENT", "LAWYER", "PARALEGAL", "ADMIN"];

function displayName(u: User): string {
  const p = u.profile;
  if (p) {
    const n = [p.first_name, p.middle_name, p.last_name, p.suffix].filter(Boolean).join(" ");
    if (n) return n;
  }
  return u.email;
}

function fmtLogin(value: string | null): string {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 16).replace("T", " ");
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminUserManagement() {
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "CLIENT" as UserRole,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await api.listUsers(1, 100, roleFilter || undefined);
    if (r.success && r.data) setUsers(r.data);
    else setError(r.message ?? "Could not load users");
    setLoading(false);
  }, [roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      email: u.email,
      first_name: u.profile?.first_name ?? "",
      last_name: u.profile?.last_name ?? "",
      phone: u.profile?.phone ?? "",
      role: (u.role?.name ?? "CLIENT") as UserRole,
      is_active: u.is_active,
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const prof = await api.updateProfile(editing.id, {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || undefined,
      });
      if (!prof.success) throw new Error(prof.message);

      if (form.email.trim() !== editing.email) {
        const em = await api.updateUserEmail(editing.id, form.email.trim());
        if (!em.success) throw new Error(em.message);
      }

      if (form.role !== editing.role?.name) {
        const ro = await api.updateUserRole(editing.id, form.role);
        if (!ro.success) throw new Error(ro.message);
      }

      if (form.is_active !== editing.is_active) {
        const st = await api.updateUserStatus(editing.id, form.is_active);
        if (!st.success) throw new Error(st.message);
      }

      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const quickSetRole = async (u: User, role: UserRole) => {
    if (u.role?.name === role) return;
    if (u.id === me?.id && role !== "ADMIN") {
      setError("You cannot remove your own administrator access.");
      return;
    }
    setRoleSavingId(u.id);
    setError("");
    const r = await api.updateUserRole(u.id, role);
    setRoleSavingId(null);
    if (!r.success) {
      setError(r.message ?? "Could not update role");
      return;
    }
    await load();
  };

  const remove = async (u: User) => {
    if (u.id === me?.id) {
      setError("You cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Remove ${displayName(u)} (${u.email}) from the platform?`)) return;
    const r = await api.deleteUser(u.id);
    if (!r.success) {
      setError(r.message ?? "Delete failed");
      return;
    }
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-zinc-400">
          Filter role
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="sanson-field ml-2"
          >
            <option value="">All</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <Button size="sm" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {editing && (
        <Card className="border-pink-500/30">
          <CardContent className="space-y-3 p-4">
            <p className="font-medium text-white">Edit user — {displayName(editing)}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input
                label="First name"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
              <Input
                label="Last name"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <label className="block text-sm sm:col-span-2">
                <span className="sanson-label">Firm role (Lawyer / Paralegal / …)</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="sanson-field mt-1.5 w-full"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_DISPLAY[r]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active account
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" loading={saving} onClick={() => void save()}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Loading users…</p>
      ) : users.length === 0 ? (
        <EmptyState title="No users" description="Users appear after registration or firm intake." />
      ) : (
        <>
          {/* Mobile: stacked cards (no horizontal scroll) */}
          <div className="space-y-3 md:hidden">
            {users.map((u) => (
              <Card key={u.id} className="sanson-panel">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{displayName(u)}</p>
                      <p className="truncate text-xs text-zinc-400">{u.email}</p>
                    </div>
                    <Badge>{u.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Last login: <span className="text-zinc-300">{fmtLogin(u.last_login_at)}</span>
                  </p>
                  <label className="block text-xs text-zinc-400">
                    Assign role
                    <select
                      className="sanson-field mt-1 w-full text-sm"
                      value={u.role?.name ?? "CLIENT"}
                      disabled={roleSavingId === u.id}
                      onChange={(e) => void quickSetRole(u, e.target.value as UserRole)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_DISPLAY[r]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(u)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={u.id === me?.id}
                      onClick={() => void remove(u)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="sanson-panel hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assign role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Last login</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-medium text-white">{displayName(u)}</p>
                        <p className="text-xs text-zinc-400">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge>{ROLE_DISPLAY[u.role?.name as UserRole] ?? u.role?.name ?? "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <select
                          className="sanson-field min-w-[9rem] text-xs"
                          value={u.role?.name ?? "CLIENT"}
                          disabled={roleSavingId === u.id}
                          onChange={(e) => void quickSetRole(u, e.target.value as UserRole)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_DISPLAY[r]}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>{u.is_active ? "Active" : "Inactive"}</TableCell>
                      <TableCell className="hidden lg:table-cell whitespace-nowrap text-xs text-zinc-400">
                        {fmtLogin(u.last_login_at)}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={u.id === me?.id}
                          onClick={() => void remove(u)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
