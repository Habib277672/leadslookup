import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import { consumeRateLimit } from "./rate-limit";

const prefix = `test:${randomUUID()}:`;

// Runs only when a database is configured (skipped in CI for now).
describe.skipIf(!process.env.DATABASE_URL)("rate limiter", () => {
  afterAll(async () => {
    const db = getDb();
    await db.rateLimitBucket.deleteMany({
      where: { key: { startsWith: prefix } },
    });
    await db.$disconnect();
  });

  it("allows up to the limit, then blocks with a retry time", async () => {
    const key = `${prefix}basic`;
    const results = [];
    for (let i = 0; i < 4; i++)
      results.push(await consumeRateLimit(key, 3, 60));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[2]?.remaining).toBe(0);
    expect(results[3]?.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(results[3]?.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("starts a new window after it expires", async () => {
    const key = `${prefix}window`;
    expect((await consumeRateLimit(key, 1, 1)).allowed).toBe(true);
    expect((await consumeRateLimit(key, 1, 1)).allowed).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect((await consumeRateLimit(key, 1, 1)).allowed).toBe(true);
  });

  it("is atomic under concurrent requests", async () => {
    const key = `${prefix}concurrent`;
    const results = await Promise.all(
      Array.from({ length: 12 }, () => consumeRateLimit(key, 5, 60)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });
});
