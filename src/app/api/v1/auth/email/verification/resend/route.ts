import { emailOnlySchema } from "@/features/auth/schemas";
import { resendVerification } from "@/server/auth/registration";
import { hashToken } from "@/server/auth/tokens";
import { logError } from "@/server/http/log";
import { getClientIp, readJsonBody } from "@/server/http/request";
import { fail, failValidation, ok } from "@/server/http/responses";
import { enforceRateLimits } from "@/server/security/limits";
import { rejectCrossOrigin } from "@/server/security/origin";

const MESSAGE =
  "If that address is waiting for confirmation, we've sent a new link.";

export async function POST(request: Request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  const ip = getClientIp(request.headers);
  const ipLimited = await enforceRateLimits([
    { key: `resend:ip:${ip}`, limit: 10, windowSeconds: 3600 },
  ]);
  if (ipLimited) return ipLimited;

  const body = await readJsonBody(request);
  if (body === undefined)
    return fail("invalid_input", "Send a JSON body.", 400);

  const parsed = emailOnlySchema.safeParse(body);
  if (!parsed.success) return failValidation(parsed.error);

  const emailLimited = await enforceRateLimits([
    {
      key: `resend:email:${hashToken(parsed.data.emailNormalized)}`,
      limit: 3,
      windowSeconds: 3600,
    },
  ]);
  if (emailLimited) return emailLimited;

  try {
    await resendVerification(parsed.data.emailNormalized);
  } catch (error) {
    logError("auth.resend", error);
    return fail(
      "internal",
      "We couldn't complete that. Please try again.",
      503,
    );
  }
  return ok({ message: MESSAGE });
}
