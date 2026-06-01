"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Save, Shield } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@sanson/ui";
import { formatUserDisplayName } from "@sanson/shared";
import { calculateAge } from "@sanson/utils";
import type { User } from "@sanson/types";
import { api } from "@/lib/api";
import { changeAccountEmail, changeAccountPassword } from "@/lib/profile-account";
import { loadProfilePhotoUrl } from "@/lib/profile-photo";
import { useAuthStore } from "@/store/auth";

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function UserProfileSettings() {
  const { user, setUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const hydrate = useCallback(
    async (u: User | null) => {
      if (!u?.profile) return;
      const p = u.profile;
      setFirstName(p.first_name ?? "");
      setMiddleName(p.middle_name ?? "");
      setLastName(p.last_name ?? "");
      setNickname(p.nickname ?? "");
      setBirthday(toDateInputValue(p.date_of_birth));
      setAddress(p.address ?? "");
      setPhone(p.phone ?? "");
      setNewEmail(u.email ?? "");
      const url = await loadProfilePhotoUrl(u.id, p);
      setPhotoUrl(url);
    },
    []
  );

  useEffect(() => {
    hydrate(user);
  }, [user, hydrate]);

  const age = calculateAge(birthday || null);
  const displayName = formatUserDisplayName(user);

  const applyUserResponse = (next: User | null | undefined) => {
    if (next) setUser(next);
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingPersonal(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.updateProfile(user.id, {
        first_name: firstName.trim(),
        middle_name: middleName.trim() ? middleName.trim() : "",
        last_name: lastName.trim(),
        nickname: nickname.trim() ? nickname.trim() : "",
        date_of_birth: birthday || null,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      if (!res.success) {
        setError(res.message || "Failed to save profile");
        return;
      }
      if (res.data?.user) applyUserResponse(res.data.user);
      else if (res.data?.profile && user) {
        setUser({ ...user, profile: res.data.profile });
      }
      setMessage("Profile saved.");
      await hydrate(res.data?.user ?? user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingPersonal(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const res = await api.uploadProfileAvatar(user.id, file);
      if (!res.success) {
        setError(res.message || "Upload failed");
        return;
      }
      if (res.data?.user) applyUserResponse(res.data.user);
      const url =
        res.data?.profile?.profile_photo_url ??
        (await loadProfilePhotoUrl(user.id, res.data?.profile ?? user.profile));
      setPhotoUrl(url);
      setMessage("Profile photo updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingEmail(true);
    setError(null);
    setMessage(null);
    try {
      await changeAccountEmail(newEmail.trim(), currentPassword);
      const res = await api.updateUserEmail(user.id, newEmail.trim());
      if (!res.success) {
        setError(res.message || "Email saved in Firebase but API sync failed.");
        return;
      }
      applyUserResponse(res.data ?? undefined);
      setCurrentPassword("");
      setMessage("Email updated. Use the new email on your next sign-in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email update failed");
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    setError(null);
    setMessage(null);
    try {
      await changeAccountPassword(newPassword, currentPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password update failed");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return <p className="text-zinc-400">Sign in to manage your profile.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <Card className="sanson-glass border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Profile photo</CardTitle>
          <CardDescription>PNG, JPEG, or WebP — max 2MB</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-pink-500/30 bg-pink-500/10">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-pink-200">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={uploadingPhoto}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              {uploadingPhoto ? "Uploading…" : "Upload photo"}
            </Button>
            <p className="mt-2 text-xs text-zinc-500">{displayName}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="sanson-glass border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Personal information</CardTitle>
          <CardDescription>Name, nickname, birthday, and address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePersonal} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">First name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Middle name</label>
              <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Last name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Nickname</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="How you prefer to be called"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Birthday</label>
              <Input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
              {age !== null && (
                <p className="mt-1 text-xs text-pink-300">Age: {age} years old</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={savingPersonal} className="gap-2">
                {savingPersonal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save personal info
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="sanson-glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-pink-400" />
            Account & security
          </CardTitle>
          <CardDescription>
            Email and password are managed through Firebase. Current password is required to confirm changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form onSubmit={handleEmailChange} className="space-y-3 border-b border-white/10 pb-8">
            <p className="text-sm font-medium text-zinc-200">Change email</p>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">New email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Current password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" variant="outline" disabled={savingEmail}>
              {savingEmail ? "Updating…" : "Update email"}
            </Button>
          </form>

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <p className="text-sm font-medium text-zinc-200">Change password</p>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Current password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">New password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Confirm new password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" variant="outline" disabled={savingPassword}>
              {savingPassword ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
