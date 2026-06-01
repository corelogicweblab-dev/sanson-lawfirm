import type { UserProfile } from "@sanson/types";
import { api } from "@/lib/api";

export function profilePhotoFromProfile(profile: UserProfile | null | undefined): string | null {
  if (!profile) return null;
  if (profile.profile_photo_url) return profile.profile_photo_url;
  const raw = profile.profile_photo;
  if (!raw) return null;
  if (raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return null;
}

export async function loadProfilePhotoUrl(
  userId: string,
  profile: UserProfile | null | undefined
): Promise<string | null> {
  const direct = profilePhotoFromProfile(profile);
  if (direct) return direct;
  if (!profile?.profile_photo?.startsWith("r2:")) return null;
  const res = await api.getProfileAvatarUrl(userId);
  if (res.success && res.data?.url) return res.data.url;
  return null;
}
