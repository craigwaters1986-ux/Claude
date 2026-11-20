import type { TypedSupabaseClient } from "@/lib/supabase/client";
import type { UserState } from "@/types/models";
import { toServiceError } from "./errors";

/** Where the signed-in user last was, on any device (null if never recorded). */
export async function getUserState(supabase: TypedSupabaseClient): Promise<UserState | null> {
  const { data, error } = await supabase.from("user_state").select("*").maybeSingle();
  if (error) throw toServiceError(error, "Could not load your last place.");
  return data;
}

/** Record where the user is now. One row per user, so this overwrites. */
export async function saveUserState(
  supabase: TypedSupabaseClient,
  userId: string,
  place: Pick<UserState, "project_id" | "view" | "level_id" | "device">,
): Promise<void> {
  const { error } = await supabase.from("user_state").upsert({ user_id: userId, ...place }, { onConflict: "user_id" });
  if (error) throw toServiceError(error, "Could not save your place.");
}
