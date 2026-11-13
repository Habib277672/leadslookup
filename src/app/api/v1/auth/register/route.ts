import { registerSchema } from "@/features/auth/schemas";
import { registerUser } from "@/server/auth/registration";
import { hashToken } from "@/server/auth/tokens";
import { getClientIp, readJsonBody } from "@/server/http/request";
import { fail, failValidation, ok } from "@/server/http/responses";
import { logError } from "@/server/http/log";
import { enforceRateLimits } from "@/server/security/limits";
import { rejectCrossOrigin } from "@/server/security/origin";

const MESSAGE =
  "If this address can be used, we've sent an email with a link to confirm it.";

export async function POST(request: Request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;

  const ip = getClientIp(request.headers);
  const ipLimited = await enforceRateLimits([
    { key: `register:ip:${ip}`, limit: 10, windowSeconds: 3600 },
  ]);
  if (ipLimited) return ipLimited;

  const body = await readJsonBody(request);
  if (body === undefined)
    return fail("invalid_input", "Send a JSON body.", 400);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return failValidation(parsed.error);

  const emailLimited = await enforceRateLimits([
    {
      key: `register:email:${hashToken(parsed.data.emailNormalized)}`,
      limit: 5,
      windowSeconds: 3600,
    },
  ]);
  if (emailLimited) return emailLimited;

  try {
    await registerUser(parsed.data);
  } catch (error) {
    logError("auth.register", error);
    return fail(
      "internal",
      "We couldn't complete that. Please try again.",
      503,
    );
  }
  return ok({ message: MESSAGE });
}
