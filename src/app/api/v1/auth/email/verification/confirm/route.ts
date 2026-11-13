import { z } from "zod";
import { setAuthCookies } from "@/server/auth/cookies";
import { confirmEmailVerification } from "@/server/auth/registration";
import { createSession } from "@/server/auth/sessions";
import { logError } from "@/server/http/log";
import { getClientIp, readJsonBody } from "@/server/http/request";
import { fail, ok } from "@/server/http/responses";
import { enforceRateLimits } from "@/server/security/limits";
import { rejectCrossOrigin } from "@/server/security/origin";

const bodySchema = z.object({ token: z.string().min(20).max(200) });
const INVALID = "This link is invalid or has expired.";

export async function POST(request: Request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  const ip = getClientIp(request.headers);
  const limited = await enforceRateLimits([
    { key: `verify:ip:${ip}`, limit: 20, windowSeconds: 3600 },
  ]);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return fail("invalid_token", INVALID, 400);

  try {
    const result = await confirmEmailVerification(parsed.data.token);
    if (!result.ok) return fail("invalid_token", INVALID, 400);

    const tokens = await createSession(result.userId, {
      userAgent: request.headers.get("user-agent"),
      ipAddress: ip === "unknown" ? null : ip,
    });
    await setAuthCookies(tokens);
    return ok({ status: "verified" });
  } catch (error) {
    logError("auth.verify", error);
    return fail("internal", "Something went wrong. Please try again.", 500);
  }
}
