import type { TypedSupabaseClient } from "@/lib/supabase/client";
import { normaliseSettings, type Settings } from "@/lib/settings/settings";
import type { Json } from "@/types/database";
import { toServiceError } from "./errors";

/** The signed-in user's settings (defaults if never saved). */
export async function getSettings(supabase: TypedSupabaseClient): Promise<Settings> {
  const { data, error } = await supabase.from("user_settings").select("settings").maybeSingle();
  if (error) throw toServiceError(error, "Could not load your settings.");
  return normaliseSettings(data?.settings);
}

export async function saveSettings(supabase: TypedSupabaseClient, userId: string, settings: Settings): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, settings: settings as unknown as Json }, { onConflict: "user_id" });
  if (error) throw toServiceError(error, "Could not save your settings.");
}
