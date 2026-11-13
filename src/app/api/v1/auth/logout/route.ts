import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  clearAuthCookies,
  REFRESH_COOKIE,
} from "@/server/auth/cookies";
import { verifyAccessToken, verifyRefreshToken } from "@/server/auth/jwt";
import { revokeSession } from "@/server/auth/sessions";
import { logError } from "@/server/http/log";
import { fail, ok } from "@/server/http/responses";
import { rejectCrossOrigin } from "@/server/security/origin";

export async function POST(request: Request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  try {
    const store = await cookies();
    const refresh = store.get(REFRESH_COOKIE)?.value;
    const access = store.get(ACCESS_COOKIE)?.value;

    // Session IDs come only from signature-verified tokens.
    const refreshClaims = refresh ? await verifyRefreshToken(refresh) : null;
    const accessClaims =
      !refreshClaims && access ? await verifyAccessToken(access) : null;
    const sessionId = refreshClaims?.sessionId ?? accessClaims?.sessionId;
    if (sessionId) await revokeSession(sessionId);

    await clearAuthCookies();
    return ok({ status: "signed_out" });
  } catch (error) {
    logError("auth.logout", error);
    await clearAuthCookies();
    return fail("internal", "Something went wrong. Please try again.", 500);
  }
}
