import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_REALTIME_CHANNELS } from "@sanson/shared";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}

export function subscribeSyncChannel(
  channelName: string,
  onPayload: (payload: unknown) => void
) {
  const supabase = getSupabase();
  if (!supabase) return () => undefined;

  const channel = supabase
    .channel(channelName)
    .on("broadcast", { event: "sync" }, ({ payload }) => onPayload(payload))
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export { SUPABASE_REALTIME_CHANNELS };
