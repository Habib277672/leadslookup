import "server-only";
import { fail } from "@/server/http/responses";
import { consumeRateLimit } from "./rate-limit";

export type LimitCheck = { key: string; limit: number; windowSeconds: number };

/** Returns a 429 response if any limit is exceeded, otherwise null. */
export async function enforceRateLimits(
  checks: LimitCheck[],
): Promise<Response | null> {
  let retryAfter = 0;
  for (const check of checks) {
    const result = await consumeRateLimit(
      check.key,
      check.limit,
      check.windowSeconds,
    );
    if (!result.allowed)
      retryAfter = Math.max(retryAfter, result.retryAfterSeconds);
  }
  return retryAfter > 0
    ? fail("rate_limited", "Too many requests. Please try again later.", 429, {
        "Retry-After": String(retryAfter),
      })
    : null;
}
