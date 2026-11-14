import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import type { GoogleProfile } from "./google";
import { resolveGoogleUser } from "./google-signin";
import { hashPassword } from "./password";

const tag = randomUUID().slice(0, 8);
const addr = (name: string) => `${name}-${tag}@example.test`;
const profile = (
  name: string,
  over: Partial<GoogleProfile> = {},
): GoogleProfile => ({
  sub: `sub-${name}-${tag}`,
  email: addr(name),
  name: `Name ${name}`,
  ...over,
});

describe.skipIf(!process.env.DATABASE_URL)(
  "google sign-in account resolution",
  () => {
    afterAll(async () => {
      const db = getDb();
      await db.user.deleteMany({
        where: { emailNormalized: { endsWith: `-${tag}@example.test` } },
      });
      await db.$disconnect();
    });

    it("creates an active, verified account with an identity and no password", async () => {
      const result = await resolveGoogleUser(profile("new"));
      if (!result.ok) throw new Error("expected success");
      expect(result.created).toBe(true);
      const user = await getDb().user.findUniqueOrThrow({
        where: { id: result.userId },
        include: { credential: true, identities: true },
      });
      expect(user.status).toBe("active");
      expect(user.role).toBe("user");
      expect(user.emailVerifiedAt).not.toBeNull();
      expect(user.credential).toBeNull();
      expect(user.displayName).toBe("Name new");
      expect(user.identities).toHaveLength(1);
      expect(user.identities[0]).toMatchObject({
        provider: "google",
        emailVerified: true,
      });
    });

    it("recognises the same Google account by sub, even if its email changed", async () => {
      const first = await resolveGoogleUser(profile("again"));
      const second = await resolveGoogleUser(
        profile("again", { email: addr("again-renamed") }),
      );
      if (!first.ok || !second.ok) throw new Error("expected success");
      expect(second.userId).toBe(first.userId);
      expect(second.created).toBe(false);
      const user = await getDb().user.findUniqueOrThrow({
        where: { id: first.userId },
        include: { identities: true },
      });
      expect(user.email).toBe(addr("again")); // the local account email is untouched
      expect(user.identities[0]?.email).toBe(addr("again-renamed"));
    });

    it("never merges into an existing active account with the same email", async () => {
      const db = getDb();
      const existing = await db.user.create({
        data: {
          email: addr("taken"),
          emailNormalized: addr("taken"),
          status: "active",
          credential: {
            create: { passwordHash: await hashPassword("some long password") },
          },
        },
      });
      const result = await resolveGoogleUser(
        profile("taken", { email: addr("taken").toUpperCase() }),
      );
      expect(result).toEqual({ ok: false, reason: "email_in_use" });
      expect(
        await db.userIdentity.count({ where: { userId: existing.id } }),
      ).toBe(0);
      expect(
        await db.userCredential.count({ where: { userId: existing.id } }),
      ).toBe(1);
    });

    it("refuses a suspended account with the same email without saying it is suspended", async () => {
      await getDb().user.create({
        data: {
          email: addr("susp-email"),
          emailNormalized: addr("susp-email"),
          status: "suspended",
        },
      });
      expect(await resolveGoogleUser(profile("susp-email"))).toEqual({
        ok: false,
        reason: "email_in_use",
      });
    });

    it("replaces an unverified pending account, so a squatter's password cannot survive", async () => {
      const db = getDb();
      const squatter = await db.user.create({
        data: {
          email: addr("squat"),
          emailNormalized: addr("squat"),
          credential: {
            create: { passwordHash: await hashPassword("attacker password") },
          },
          verificationTokens: {
            create: {
              tokenHash: `hash-${tag}`,
              expiresAt: new Date(Date.now() + 3600_000),
            },
          },
        },
      });
      const result = await resolveGoogleUser(profile("squat"));
      if (!result.ok) throw new Error("expected success");
      expect(result.created).toBe(true);
      expect(result.userId).not.toBe(squatter.id);
      expect(
        await db.user.findUnique({ where: { id: squatter.id } }),
      ).toBeNull();
      expect(
        await db.userCredential.count({ where: { userId: squatter.id } }),
      ).toBe(0);
      expect(
        await db.emailVerificationToken.count({
          where: { userId: squatter.id },
        }),
      ).toBe(0);
      const user = await db.user.findUniqueOrThrow({
        where: { id: result.userId },
        include: { credential: true },
      });
      expect(user.status).toBe("active");
      expect(user.credential).toBeNull();
    });

    it("blocks a Google identity whose account was suspended", async () => {
      const first = await resolveGoogleUser(profile("later-susp"));
      if (!first.ok) throw new Error("expected success");
      await getDb().user.update({
        where: { id: first.userId },
        data: { status: "suspended" },
      });
      expect(await resolveGoogleUser(profile("later-susp"))).toEqual({
        ok: false,
        reason: "suspended",
      });
    });

    it("creates exactly one account when first sign-ins race", async () => {
      const results = await Promise.all(
        Array.from({ length: 4 }, () => resolveGoogleUser(profile("race"))),
      );
      const ids = new Set<string>();
      for (const r of results) {
        if (!r.ok) throw new Error("expected success");
        ids.add(r.userId);
      }
      expect(ids.size).toBe(1);
      expect(
        await getDb().user.count({ where: { emailNormalized: addr("race") } }),
      ).toBe(1);
    });

    it("falls back to the email name and clips very long names", async () => {
      const noName = await resolveGoogleUser(profile("noname", { name: null }));
      if (!noName.ok) throw new Error("expected success");
      expect(
        (await getDb().user.findUniqueOrThrow({ where: { id: noName.userId } }))
          .displayName,
      ).toBe(`noname-${tag}`);

      const long = await resolveGoogleUser(
        profile("longname", { name: "x".repeat(200) }),
      );
      if (!long.ok) throw new Error("expected success");
      expect(
        (await getDb().user.findUniqueOrThrow({ where: { id: long.userId } }))
          .displayName,
      ).toHaveLength(80);
    });
  },
);
