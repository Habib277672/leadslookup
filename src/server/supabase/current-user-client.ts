import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  authenticateAccessToken,
  type CurrentUser,
} from "@/server/auth/authenticate";
import { ACCESS_COOKIE } from "@/server/auth/cookies";
import { createUserSupabaseClient } from "./user-client";

/**
 * Our own check comes first (live session, active account), then the token is used
 * for RLS-protected queries. Returns null when the visitor is not signed in.
 */
export async function getSupabaseForCurrentUser(): Promise<{
  user: CurrentUser;
  supabase: SupabaseClient;
} | null> {
  await connection();
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const user = await authenticateAccessToken(token);
  if (!user || !token) return null;
  return { user, supabase: createUserSupabaseClient(token) };
}
