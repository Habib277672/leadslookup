import { clearAuthCookies } from "@/server/auth/cookies";
import { getCurrentUser } from "@/server/auth/current-user";
import { revokeAllUserSessions } from "@/server/auth/sessions";
import { logError } from "@/server/http/log";
import { fail, ok } from "@/server/http/responses";
import { rejectCrossOrigin } from "@/server/security/origin";

export async function POST(request: Request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  try {
    const user = await getCurrentUser();
    if (!user) return fail("unauthenticated", "Please sign in.", 401);
    await revokeAllUserSessions(user.id);
    await clearAuthCookies();
    return ok({ status: "signed_out_everywhere" });
  } catch (error) {
    logError("auth.logout-all", error);
    return fail("internal", "Something went wrong. Please try again.", 500);
  }
}
