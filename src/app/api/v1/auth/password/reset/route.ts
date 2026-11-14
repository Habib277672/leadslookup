import { resetPasswordSchema } from "@/features/auth/schemas";
import { clearAuthCookies } from "@/server/auth/cookies";
import { resetPassword } from "@/server/auth/password-reset";
import { logError } from "@/server/http/log";
import { getClientIp, readJsonBody } from "@/server/http/request";
import { fail, failValidation, ok } from "@/server/http/responses";
import { enforceRateLimits } from "@/server/security/limits";
import { rejectCrossOrigin } from "@/server/security/origin";

export async function POST(request: Request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  const ip = getClientIp(request.headers);
  const limited = await enforceRateLimits([
    { key: `reset:ip:${ip}`, limit: 20, windowSeconds: 3600 },
  ]);
  if (limited) return limited;

  const body = await readJsonBody(request);
  if (body === undefined)
    return fail("invalid_input", "Send a JSON body.", 400);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return failValidation(parsed.error);

  try {
    const result = await resetPassword(parsed.data.token, parsed.data.password);
    if (!result.ok)
      return fail("invalid_token", "This link is invalid or has expired.", 400);
    await clearAuthCookies(); // every session was revoked, including this browser's
    return ok({ status: "password_updated" });
  } catch (error) {
    logError("auth.reset", error);
    return fail("internal", "Something went wrong. Please try again.", 500);
  }
}
