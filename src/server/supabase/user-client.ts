import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * A Supabase client that acts as one specific user: Postgres sees their JWT and applies RLS.
 * Created per request. It never uses a service-role key and never persists a session.
 */
export function createUserSupabaseClient(accessToken: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set");
  }
  return createClient(url, key, {
    accessToken: async () => accessToken,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
