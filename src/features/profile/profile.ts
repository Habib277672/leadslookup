import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileUpdate } from "./schema";

type Row = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  theme_preference: string;
};

export type OwnProfile = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  themePreference: string;
};

/** Runs under the user's own RLS: it can only ever touch their row and these two columns. */
export async function updateOwnProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: ProfileUpdate,
): Promise<OwnProfile | null> {
  const changes: Record<string, string> = {};
  if (patch.displayName !== undefined) changes.display_name = patch.displayName;
  if (patch.themePreference !== undefined)
    changes.theme_preference = patch.themePreference;

  const { data, error } = await supabase
    .from("users")
    .update(changes)
    .eq("id", userId)
    .select("id,email,display_name,role,theme_preference")
    .maybeSingle<Row>();

  if (error)
    throw new Error(
      `profile update failed: ${error.code ?? ""} ${error.message}`,
    );
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    role: data.role,
    themePreference: data.theme_preference,
  };
}
