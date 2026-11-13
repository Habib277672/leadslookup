import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "@/server/db/client";
import type { EmailMessage, EmailService } from "@/server/email/email-service";
import { verifyAccessToken, verifyRefreshToken } from "./jwt";
import { verifyPassword } from "./password";
import {
  confirmEmailVerification,
  registerUser,
  resendVerification,
} from "./registration";
import { createSession } from "./sessions";
import { hashToken } from "./tokens";

const tag = randomUUID().slice(0, 8);
const addr = (name: string) => `${name}-${tag}@example.test`;
const input = (name: string, password = "first password 123") => ({
  displayName: `Test ${name}`,
  email: addr(name),
  emailNormalized: addr(name),
  password,
});

function fakeEmail() {
  const sent: EmailMessage[] = [];
  const service: EmailService = {
    async send(message) {
      sent.push(message);
      return { id: "test" };
    },
  };
  const at = (index: number): EmailMessage => {
    const message = sent[index];
    if (!message) throw new Error(`no email at index ${index}`);
    return message;
  };
  return { sent, service, at };
}
const tokenIn = (message: EmailMessage) =>
  decodeURIComponent(/token=(\S+)/.exec(message.text)?.[1] ?? "");

const user = (name: string) =>
  getDb().user.findUniqueOrThrow({
    where: { emailNormalized: addr(name) },
    include: { credential: true, verificationTokens: true },
  });

// Runs only when a database is configured (skipped in CI for now).
describe.skipIf(!process.env.DATABASE_URL)(
  "registration and verification",
  () => {
    afterAll(async () => {
      const db = getDb();
      await db.user.deleteMany({
        where: { emailNormalized: { endsWith: `-${tag}@example.test` } },
      });
      await db.$disconnect();
    });

    it("creates a pending account and emails one verification link", async () => {
      const mail = fakeEmail();
      await registerUser(input("new"), { email: mail.service });

      const created = await user("new");
      expect(created.status).toBe("pending_verification");
      expect(created.emailVerifiedAt).toBeNull();
      expect(created.credential?.passwordHash.startsWith("$argon2id$")).toBe(
        true,
      );
      expect(mail.sent).toHaveLength(1);
      expect(mail.at(0).to).toBe(addr("new"));

      const raw = tokenIn(mail.at(0));
      expect(created.verificationTokens[0]?.tokenHash).toBe(hashToken(raw));
      expect(created.verificationTokens[0]?.tokenHash).not.toBe(raw);
    });

    it("lets the latest registrant win on a pending account and kills old links", async () => {
      const mail = fakeEmail();
      await registerUser(input("squat", "attacker password 1"), {
        email: mail.service,
      });
      await registerUser(input("squat", "victim password 22"), {
        email: mail.service,
      });

      const rows = await getDb().user.count({
        where: { emailNormalized: addr("squat") },
      });
      expect(rows).toBe(1);
      const stored = (await user("squat")).credential?.passwordHash ?? "";
      expect(await verifyPassword(stored, "victim password 22")).toBe(true);
      expect(await verifyPassword(stored, "attacker password 1")).toBe(false);

      expect((await confirmEmailVerification(tokenIn(mail.at(0)))).ok).toBe(
        false,
      );
      expect((await confirmEmailVerification(tokenIn(mail.at(1)))).ok).toBe(
        true,
      );
    });

    it("does not change an active account and sends only a notice", async () => {
      const mail = fakeEmail();
      await registerUser(input("active"), { email: mail.service });
      await confirmEmailVerification(tokenIn(mail.at(0)));

      await registerUser(input("active", "different password 9"), {
        email: mail.service,
      });
      expect(mail.sent).toHaveLength(2);
      expect(mail.at(1).subject).toBe("You already have a LeadsLookup account");
      expect(mail.at(1).text).not.toContain("token=");
      const stored = (await user("active")).credential?.passwordHash ?? "";
      expect(await verifyPassword(stored, "first password 123")).toBe(true);
    });

    it("activates once and burns the token", async () => {
      const mail = fakeEmail();
      await registerUser(input("once"), { email: mail.service });
      const raw = tokenIn(mail.at(0));

      const first = await confirmEmailVerification(raw);
      expect(first.ok).toBe(true);
      const activated = await user("once");
      expect(activated.status).toBe("active");
      expect(activated.emailVerifiedAt).not.toBeNull();

      expect((await confirmEmailVerification(raw)).ok).toBe(false);
      expect((await confirmEmailVerification("garbage")).ok).toBe(false);
    });

    it("rejects expired tokens and leaves the account pending", async () => {
      const mail = fakeEmail();
      await registerUser(input("expired"), { email: mail.service });
      await getDb().emailVerificationToken.updateMany({
        where: { user: { emailNormalized: addr("expired") } },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      expect((await confirmEmailVerification(tokenIn(mail.at(0)))).ok).toBe(
        false,
      );
      expect((await user("expired")).status).toBe("pending_verification");
    });

    it("never activates a suspended account", async () => {
      const mail = fakeEmail();
      await registerUser(input("suspended"), { email: mail.service });
      await getDb().user.update({
        where: { emailNormalized: addr("suspended") },
        data: { status: "suspended" },
      });
      expect((await confirmEmailVerification(tokenIn(mail.at(0)))).ok).toBe(
        false,
      );
      expect((await user("suspended")).status).toBe("suspended");
    });

    it("lets exactly one of several simultaneous confirmations succeed", async () => {
      const mail = fakeEmail();
      await registerUser(input("race"), { email: mail.service });
      const raw = tokenIn(mail.at(0));
      const results = await Promise.all(
        Array.from({ length: 5 }, () => confirmEmailVerification(raw)),
      );
      expect(results.filter((r) => r.ok)).toHaveLength(1);
    });

    it("resends only for pending accounts and never reveals anything", async () => {
      const mail = fakeEmail();
      await registerUser(input("resend"), { email: mail.service });
      await resendVerification(addr("resend"), { email: mail.service });
      expect(mail.sent).toHaveLength(2);
      expect((await confirmEmailVerification(tokenIn(mail.at(0)))).ok).toBe(
        false,
      );
      expect((await confirmEmailVerification(tokenIn(mail.at(1)))).ok).toBe(
        true,
      );

      await resendVerification(addr("resend"), { email: mail.service }); // now active
      await resendVerification(addr("nobody"), { email: mail.service }); // unknown
      expect(mail.sent).toHaveLength(2);
    });

    it("creates a session whose refresh token is stored only as a hash", async () => {
      const mail = fakeEmail();
      await registerUser(input("session"), { email: mail.service });
      const confirmed = await confirmEmailVerification(tokenIn(mail.at(0)));
      if (!confirmed.ok) throw new Error("confirmation failed");

      const tokens = await createSession(confirmed.userId, {
        userAgent: "Test Agent",
        ipAddress: "203.0.113.7",
      });
      expect(await verifyAccessToken(tokens.accessToken)).toEqual({
        userId: confirmed.userId,
        sessionId: tokens.sessionId,
      });
      const refresh = await verifyRefreshToken(tokens.refreshToken);
      expect(refresh?.sessionId).toBe(tokens.sessionId);

      const row = await getDb().authSession.findUniqueOrThrow({
        where: { id: tokens.sessionId },
        include: { refreshTokens: true },
      });
      expect(row.ipAddress).toBe("203.0.113.7");
      expect(row.revokedAt).toBeNull();
      expect(row.refreshTokens).toHaveLength(1);
      expect(row.refreshTokens[0]?.jti).toBe(refresh?.jti);
      expect(row.refreshTokens[0]?.tokenHash).toBe(
        hashToken(tokens.refreshToken),
      );
    });
  },
);
