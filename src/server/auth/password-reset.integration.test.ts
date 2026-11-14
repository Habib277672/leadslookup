import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { UserStatus } from "@/generated/prisma/enums";
import { getDb } from "@/server/db/client";
import type { EmailMessage, EmailService } from "@/server/email/email-service";
import { authenticateAccessToken } from "./authenticate";
import { checkCredentials } from "./login";
import { hashPassword } from "./password";
import { requestPasswordReset, resetPassword } from "./password-reset";
import { createSession, rotateRefreshToken } from "./sessions";

const tag = randomUUID().slice(0, 8);
const addr = (name: string) => `${name}-${tag}@example.test`;
const OLD = "old password value";
const NEW = "brand new password";

function stubEmail() {
  const sent: EmailMessage[] = [];
  const service: EmailService = {
    send: async (m) => {
      sent.push(m);
      return { id: "stub" };
    },
  };
  return { sent, service };
}
const tokenFrom = (m: EmailMessage) =>
  /token=([A-Za-z0-9_-]+)/.exec(m.text)?.[1] ?? "";

async function makeUser(
  name: string,
  status: UserStatus = "active",
  password: string | null = OLD,
) {
  const email = addr(name);
  return getDb().user.create({
    data: {
      email,
      emailNormalized: email,
      displayName: name,
      status,
      emailVerifiedAt: status === "pending_verification" ? null : new Date(),
      credential:
        password === null
          ? undefined
          : { create: { passwordHash: await hashPassword(password) } },
    },
  });
}

describe.skipIf(!process.env.DATABASE_URL)("forgot and reset password", () => {
  afterAll(async () => {
    const db = getDb();
    await db.user.deleteMany({
      where: { emailNormalized: { endsWith: `-${tag}@example.test` } },
    });
    await db.$disconnect();
  });

  it("emails one link to an active account and nothing for unknown, pending or suspended ones", async () => {
    const { sent, service } = stubEmail();
    const user = await makeUser("forgot-ok");
    await makeUser("forgot-pending", "pending_verification");
    await makeUser("forgot-suspended", "suspended");

    for (const name of [
      "forgot-ok",
      "forgot-pending",
      "forgot-suspended",
      "nobody",
    ]) {
      await requestPasswordReset(addr(name), { email: service });
    }
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe(addr("forgot-ok"));
    const rows = await getDb().passwordResetToken.findMany({
      where: { userId: user.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).not.toContain(tokenFrom(sent[0]!)); // stored hashed
    expect(rows[0]!.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
      30 * 60 * 1000,
    );
  });

  it("invalidates the older link when a new one is requested", async () => {
    const { sent, service } = stubEmail();
    await makeUser("forgot-twice");
    await requestPasswordReset(addr("forgot-twice"), { email: service });
    await requestPasswordReset(addr("forgot-twice"), { email: service });
    expect(
      await resetPassword(tokenFrom(sent[0]!), NEW, { email: service }),
    ).toEqual({ ok: false });
    expect(
      await resetPassword(tokenFrom(sent[1]!), NEW, { email: service }),
    ).toEqual({ ok: true });
  });

  it("changes the password, revokes every session and sends a notice", async () => {
    const { sent, service } = stubEmail();
    const user = await makeUser("reset-ok");
    const other = await makeUser("reset-bystander");
    const a = await createSession(user.id);
    const b = await createSession(user.id);
    const c = await createSession(other.id);

    await requestPasswordReset(addr("reset-ok"), { email: service });
    expect(
      await resetPassword(tokenFrom(sent[0]!), NEW, { email: service }),
    ).toEqual({ ok: true });

    expect(await checkCredentials(addr("reset-ok"), NEW)).toEqual({
      ok: true,
      userId: user.id,
    });
    expect(await checkCredentials(addr("reset-ok"), OLD)).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
    for (const s of [a, b]) {
      expect(await authenticateAccessToken(s.accessToken)).toBeNull();
      expect((await rotateRefreshToken(s.refreshToken)).ok).toBe(false);
    }
    expect((await authenticateAccessToken(c.accessToken))?.id).toBe(other.id);
    expect(sent.at(-1)?.subject).toBe("Your LeadsLookup password was changed");
  });

  it("is single-use, and rejects expired, garbage and suspended-account tokens", async () => {
    const { sent, service } = stubEmail();
    const user = await makeUser("reset-once");
    await requestPasswordReset(addr("reset-once"), { email: service });
    const token = tokenFrom(sent[0]!);
    expect((await resetPassword(token, NEW, { email: service })).ok).toBe(true);
    expect(
      (await resetPassword(token, "another new password", { email: service }))
        .ok,
    ).toBe(false);
    expect((await checkCredentials(addr("reset-once"), NEW)).ok).toBe(true);

    await requestPasswordReset(addr("reset-once"), { email: service });
    const expired = tokenFrom(sent.at(-1)!);
    await getDb().passwordResetToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(
      (await resetPassword(expired, "yet another one", { email: service })).ok,
    ).toBe(false);
    expect((await resetPassword("garbage", NEW, { email: service })).ok).toBe(
      false,
    );

    const suspended = await makeUser("reset-suspended");
    await requestPasswordReset(addr("reset-suspended"), { email: service });
    const sToken = tokenFrom(sent.at(-1)!);
    await getDb().user.update({
      where: { id: suspended.id },
      data: { status: "suspended" },
    });
    expect((await resetPassword(sToken, NEW, { email: service })).ok).toBe(
      false,
    );
  });

  it("lets exactly one of several simultaneous resets win", async () => {
    const { sent, service } = stubEmail();
    await makeUser("reset-parallel");
    await requestPasswordReset(addr("reset-parallel"), { email: service });
    const token = tokenFrom(sent[0]!);
    const results = await Promise.all(
      Array.from({ length: 4 }, (_, i) =>
        resetPassword(token, `parallel password ${i}`, { email: service }),
      ),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("lets a Google-only account add a password without touching its identity", async () => {
    const { sent, service } = stubEmail();
    const user = await makeUser("reset-google", "active", null);
    await requestPasswordReset(addr("reset-google"), { email: service });
    expect(
      (await resetPassword(tokenFrom(sent[0]!), NEW, { email: service })).ok,
    ).toBe(true);
    expect(await checkCredentials(addr("reset-google"), NEW)).toEqual({
      ok: true,
      userId: user.id,
    });
  });

  it("does not fail the reset when the notice email cannot be sent", async () => {
    const { sent, service } = stubEmail();
    await makeUser("reset-noticefail");
    await requestPasswordReset(addr("reset-noticefail"), { email: service });
    const broken: EmailService = {
      send: async () => {
        throw new Error("smtp down");
      },
    };
    expect(
      (await resetPassword(tokenFrom(sent[0]!), NEW, { email: broken })).ok,
    ).toBe(true);
    expect((await checkCredentials(addr("reset-noticefail"), NEW)).ok).toBe(
      true,
    );
  });
});
