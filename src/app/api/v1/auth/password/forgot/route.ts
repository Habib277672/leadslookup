import { after } from "next/server";
import { forgotPasswordSchema } from "@/features/auth/schemas";
import { requestPasswordReset } from "@/server/auth/password-reset";
import { hashToken } from "@/server/auth/tokens";
import { logError } from "@/server/http/log";
import { getClientIp, readJsonBody } from "@/server/http/request";
import { fail, failValidation, ok } from "@/server/http/responses";
import { enforceRateLimits } from "@/server/security/limits";
import { rejectCrossOrigin } from "@/server/security/origin";

const MESSAGE =
  "If an account exists for that address, we've sent a link to reset the password.";

export async function POST(request: Request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  const ip = getClientIp(request.headers);
  const ipLimited = await enforceRateLimits([
    { key: `forgot:ip:${ip}`, limit: 10, windowSeconds: 3600 },
  ]);
  if (ipLimited) return ipLimited;

  const body = await readJsonBody(request);
  if (body === undefined)
    return fail("invalid_input", "Send a JSON body.", 400);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return failValidation(parsed.error);

  const emailLimited = await enforceRateLimits([
    {
      key: `forgot:email:${hashToken(parsed.data.emailNormalized)}`,
      limit: 3,
      windowSeconds: 3600,
    },
  ]);
  if (emailLimited) return emailLimited;

  // Runs after the response is sent, so timing never reveals whether the account exists.
  after(async () => {
    try {
      await requestPasswordReset(parsed.data.emailNormalized);
    } catch (error) {
      logError("auth.forgot", error);
    }
  });
  return ok({ message: MESSAGE });
}
