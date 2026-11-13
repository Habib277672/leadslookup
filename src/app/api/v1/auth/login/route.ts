import { loginSchema } from "@/features/auth/schemas";
import { setAuthCookies } from "@/server/auth/cookies";
import { checkCredentials, type LoginResult } from "@/server/auth/login";
import { createSession } from "@/server/auth/sessions";
import { hashToken } from "@/server/auth/tokens";
import { logError } from "@/server/http/log";
import { getClientIp, readJsonBody } from "@/server/http/request";
import { fail, failValidation, ok } from "@/server/http/responses";
import { enforceRateLimits } from "@/server/security/limits";
import { rejectCrossOrigin } from "@/server/security/origin";

function failLogin(reason: Extract<LoginResult, { ok: false }>["reason"]) {
  switch (reason) {
    case "verification_required":
      return fail(
        "verification_required",
        "Confirm your email address first. We can send a new link.",
        403,
      );
    case "account_suspended":
      return fail(
        "account_suspended",
        "This account is unavailable. Please contact support.",
        403,
      );
    default:
      return fail(
        "invalid_credentials",
        "Email or password is incorrect.",
        401,
      );
  }
}

export async function POST(request: Request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  const ip = getClientIp(request.headers);
  const ipLimited = await enforceRateLimits([
    { key: `login:ip:${ip}`, limit: 30, windowSeconds: 900 },
  ]);
  if (ipLimited) return ipLimited;

  const body = await readJsonBody(request);
  if (body === undefined)
    return fail("invalid_input", "Send a JSON body.", 400);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return failValidation(parsed.error);

  const emailLimited = await enforceRateLimits([
    {
      key: `login:email:${hashToken(parsed.data.emailNormalized)}`,
      limit: 10,
      windowSeconds: 900,
    },
  ]);
  if (emailLimited) return emailLimited;

  try {
    const result = await checkCredentials(
      parsed.data.emailNormalized,
      parsed.data.password,
    );
    if (!result.ok) return failLogin(result.reason);

    const tokens = await createSession(result.userId, {
      userAgent: request.headers.get("user-agent"),
      ipAddress: ip === "unknown" ? null : ip,
    });
    await setAuthCookies(tokens);
    return ok({ status: "signed_in" });
  } catch (error) {
    logError("auth.login", error);
    return fail("internal", "Something went wrong. Please try again.", 500);
  }
}
