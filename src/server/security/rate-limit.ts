import "server-only";
import { getDb } from "@/server/db/client";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Fixed-window counter in Postgres. One atomic statement, using the database
 * clock, so concurrent requests cannot slip past the limit.
 * Build keys from non-sensitive parts, e.g. `login:ip:1.2.3.4`.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const rows = await getDb().$queryRaw<
    { count: number; retry_after: number }[]
  >`
    INSERT INTO rate_limit_buckets AS b (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN b.window_start <= now() - make_interval(secs => ${windowSeconds}::double precision)
        THEN 1 ELSE b.count + 1 END,
      window_start = CASE
        WHEN b.window_start <= now() - make_interval(secs => ${windowSeconds}::double precision)
        THEN now() ELSE b.window_start END
    RETURNING
      b.count AS count,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM
        (b.window_start + make_interval(secs => ${windowSeconds}::double precision) - now()))))::int
        AS retry_after`;

  const row = rows[0];
  if (!row) throw new Error("rate limit upsert returned no row");
  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterSeconds: row.retry_after,
  };
}

/** Housekeeping; call occasionally. */
export async function deleteExpiredRateLimits(olderThanSeconds = 86_400) {
  return getDb().$executeRaw`
    DELETE FROM rate_limit_buckets
    WHERE window_start < now() - make_interval(secs => ${olderThanSeconds}::double precision)`;
}
