import { cookies } from "next/headers";
import {
  clearAuthCookies,
  REFRESH_COOKIE,
  setAuthCookies,
} from "@/server/auth/cookies";
import { rotateRefreshToken } from "@/server/auth/sessions";
import { logError } from "@/server/http/log";
import { getClientIp } from "@/server/http/request";
import { fail, ok } from "@/server/http/responses";
import { enforceRateLimits } from "@/server/security/limits";
import { rejectCrossOrigin } from "@/server/security/origin";

export async function POST(request: Request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  const ip = getClientIp(request.headers);
  const limited = await enforceRateLimits([
    { key: `refresh:ip:${ip}`, limit: 60, windowSeconds: 900 },
  ]);
  if (limited) return limited;

  const token = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!token) return fail("unauthenticated", "Please sign in.", 401);

  try {
    const result = await rotateRefreshToken(token);
    if (result.ok) {
      await setAuthCookies(result.tokens);
      return ok({ status: "refreshed" });
    }
    if (result.reason === "concurrent") {
      // A sibling request just rotated the token and set fresh cookies. Keep them; the client retries once.
      return fail("conflict", "Session was just refreshed. Retry.", 409);
    }
    await clearAuthCookies();
    return fail("unauthenticated", "Please sign in.", 401);
  } catch (error) {
    logError("auth.refresh", error);
    return fail("internal", "Something went wrong. Please try again.", 500);
  }
}
