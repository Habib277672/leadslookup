import { z } from "zod";
import { revokeOwnSession } from "@/features/sessions/service";
import { getCurrentUser } from "@/server/auth/current-user";
import { logError } from "@/server/http/log";
import { fail, ok } from "@/server/http/responses";
import { enforceRateLimits } from "@/server/security/limits";
import { rejectCrossOrigin } from "@/server/security/origin";

const noStore = { "Cache-Control": "no-store" };

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  const id = z.uuid().safeParse((await context.params).id);
  if (!id.success) return fail("invalid_input", "Invalid session.", 400);

  try {
    const user = await getCurrentUser();
    if (!user) return fail("unauthenticated", "Please sign in.", 401, noStore);
    if (id.data === user.sessionId) {
      return fail(
        "invalid_input",
        "This is the device you are using. Use Log out instead.",
        400,
        noStore,
      );
    }

    const limited = await enforceRateLimits([
      { key: `sessions:revoke:user:${user.id}`, limit: 30, windowSeconds: 900 },
    ]);
    if (limited) return limited;

    // Someone else's session and a missing one answer the same way.
    const revoked = await revokeOwnSession(user.id, id.data);
    if (!revoked) {
      return fail(
        "not_found",
        "That session is no longer active.",
        404,
        noStore,
      );
    }
    return ok({ status: "revoked" }, { headers: noStore });
  } catch (error) {
    logError("me.sessions.revoke", error);
    return fail("internal", "Something went wrong. Please try again.", 500);
  }
}
