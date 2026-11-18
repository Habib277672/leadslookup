import { profileUpdateSchema } from "@/features/profile/schema";
import { updateOwnProfile } from "@/features/profile/profile";
import { getCurrentUser } from "@/server/auth/current-user";
import { logError } from "@/server/http/log";
import { readJsonBody } from "@/server/http/request";
import { fail, failValidation, ok } from "@/server/http/responses";
import { enforceRateLimits } from "@/server/security/limits";
import { rejectCrossOrigin } from "@/server/security/origin";
import { getSupabaseForCurrentUser } from "@/server/supabase/current-user-client";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in.", 401, noStore);
  return ok(
    {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      themePreference: user.themePreference,
    },
    { headers: noStore },
  );
}

export async function PATCH(request: Request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  const session = await getSupabaseForCurrentUser();
  if (!session) return fail("unauthenticated", "Please sign in.", 401, noStore);

  const limited = await enforceRateLimits([
    { key: `profile:user:${session.user.id}`, limit: 60, windowSeconds: 3600 },
  ]);
  if (limited) return limited;

  const body = await readJsonBody(request);
  if (body === undefined)
    return fail("invalid_input", "Send a JSON body.", 400);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return failValidation(parsed.error);

  try {
    const profile = await updateOwnProfile(
      session.supabase,
      session.user.id,
      parsed.data,
    );
    if (!profile) return fail("not_found", "Profile not found.", 404, noStore);
    return ok(profile, { headers: noStore });
  } catch (error) {
    logError("profile.update", error);
    return fail(
      "internal",
      "Something went wrong. Please try again.",
      500,
      noStore,
    );
  }
}
