import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { UserStatus } from "@/generated/prisma/enums";
import { getDb } from "@/server/db/client";
import { authenticateAccessToken } from "./authenticate";
import { verifyRefreshToken } from "./jwt";
import { checkCredentials } from "./login";
import { hashPassword } from "./password";
import {
  createSession,
  revokeAllUserSessions,
  revokeSession,
  rotateRefreshToken,
} from "./sessions";

const tag = randomUUID().slice(0, 8);
const addr = (name: string) => `${name}-${tag}@example.test`;
const PASSWORD = "correct horse battery";

async function makeUser(
  name: string,
  options: { status?: UserStatus; password?: string | null } = {},
) {
  const email = addr(name);
  const password = options.password === undefined ? PASSWORD : options.password;
  const status = options.status ?? "active";
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

const sessionRow = (id: string) =>
  getDb().authSession.findUniqueOrThrow({
    where: { id },
    include: { refreshTokens: true },
  });

// Runs only when a database is configured (skipped in CI for now).
describe.skipIf(!process.env.DATABASE_URL)(
  "login, sessions and rotation",
  () => {
    afterAll(async () => {
      const db = getDb();
      await db.user.deleteMany({
        where: { emailNormalized: { endsWith: `-${tag}@example.test` } },
      });
      await db.$disconnect();
    });

    describe("checkCredentials", () => {
      it("accepts the right password on an active account", async () => {
        const user = await makeUser("login-ok");
        expect(await checkCredentials(addr("login-ok"), PASSWORD)).toEqual({
          ok: true,
          userId: user.id,
        });
      });

      it("answers identically for a wrong password, an unknown email and a Google-only account", async () => {
        await makeUser("wrongpw");
        await makeUser("googleonly", { password: null });
        const attempts: [string, string][] = [
          [addr("wrongpw"), "not the password"],
          [addr("nobody"), PASSWORD],
          [addr("googleonly"), PASSWORD],
        ];
        for (const [email, password] of attempts) {
          expect(await checkCredentials(email, password)).toEqual({
            ok: false,
            reason: "invalid_credentials",
          });
        }
      });

      it("reveals pending or suspended state only after a correct password", async () => {
        await makeUser("pending", { status: "pending_verification" });
        await makeUser("suspended", { status: "suspended" });
        expect(
          await checkCredentials(addr("pending"), "wrong password"),
        ).toEqual({ ok: false, reason: "invalid_credentials" });
        expect(await checkCredentials(addr("pending"), PASSWORD)).toEqual({
          ok: false,
          reason: "verification_required",
        });
        expect(await checkCredentials(addr("suspended"), PASSWORD)).toEqual({
          ok: false,
          reason: "account_suspended",
        });
      });
    });

    describe("refresh rotation", () => {
      it("rotates once: old token consumed, new token chained", async () => {
        const user = await makeUser("rotate");
        const first = await createSession(user.id);
        const rotated = await rotateRefreshToken(first.refreshToken);
        if (!rotated.ok) throw new Error("rotation failed");

        expect(rotated.tokens.sessionId).toBe(first.sessionId);
        expect(rotated.tokens.refreshToken).not.toBe(first.refreshToken);
        const rows = (await sessionRow(first.sessionId)).refreshTokens;
        expect(rows).toHaveLength(2);
        expect(rows.filter((r) => r.consumedAt !== null)).toHaveLength(1);
        expect(rows.find((r) => r.consumedAt)?.replacedByJti).toBeTruthy();
        expect(
          (await authenticateAccessToken(rotated.tokens.accessToken))?.id,
        ).toBe(user.id);
      });

      it("treats a used token returning after the grace window as theft and revokes the session", async () => {
        const user = await makeUser("replay");
        const first = await createSession(user.id);
        const rotated = await rotateRefreshToken(first.refreshToken);
        if (!rotated.ok) throw new Error("rotation failed");

        const old = await verifyRefreshToken(first.refreshToken);
        if (!old) throw new Error("old token should verify");
        await getDb().authRefreshToken.updateMany({
          where: { jti: old.jti },
          data: { consumedAt: new Date(Date.now() - 60_000) },
        });

        expect(await rotateRefreshToken(first.refreshToken)).toEqual({
          ok: false,
          reason: "replay",
        });
        expect((await sessionRow(first.sessionId)).revokedAt).not.toBeNull();
        expect(await rotateRefreshToken(rotated.tokens.refreshToken)).toEqual({
          ok: false,
          reason: "invalid",
        });
        expect(
          await authenticateAccessToken(rotated.tokens.accessToken),
        ).toBeNull();
      });

      it("tolerates an immediate second use without revoking (two tabs)", async () => {
        const user = await makeUser("grace");
        const first = await createSession(user.id);
        const rotated = await rotateRefreshToken(first.refreshToken);
        if (!rotated.ok) throw new Error("rotation failed");

        expect(await rotateRefreshToken(first.refreshToken)).toEqual({
          ok: false,
          reason: "concurrent",
        });
        expect((await sessionRow(first.sessionId)).revokedAt).toBeNull();
        expect((await rotateRefreshToken(rotated.tokens.refreshToken)).ok).toBe(
          true,
        );
      });

      it("lets exactly one of several simultaneous rotations win without revoking", async () => {
        const user = await makeUser("parallel");
        const first = await createSession(user.id);
        const results = await Promise.all(
          Array.from({ length: 4 }, () =>
            rotateRefreshToken(first.refreshToken),
          ),
        );
        expect(results.filter((r) => r.ok)).toHaveLength(1);
        for (const r of results) if (!r.ok) expect(r.reason).toBe("concurrent");
        expect((await sessionRow(first.sessionId)).revokedAt).toBeNull();
      });

      it("rejects tampered tokens, access tokens, expired sessions and suspended accounts", async () => {
        const user = await makeUser("rejects");
        const first = await createSession(user.id);
        expect(
          (await rotateRefreshToken(first.refreshToken.slice(0, -3) + "AAA"))
            .ok,
        ).toBe(false);
        expect(await rotateRefreshToken(first.accessToken)).toEqual({
          ok: false,
          reason: "invalid",
        });

        await getDb().authSession.update({
          where: { id: first.sessionId },
          data: { expiresAt: new Date(Date.now() - 1000) },
        });
        expect(await rotateRefreshToken(first.refreshToken)).toEqual({
          ok: false,
          reason: "invalid",
        });

        const other = await makeUser("rejects-suspended");
        const second = await createSession(other.id);
        await getDb().user.update({
          where: { id: other.id },
          data: { status: "suspended" },
        });
        expect(await rotateRefreshToken(second.refreshToken)).toEqual({
          ok: false,
          reason: "invalid",
        });
        expect((await sessionRow(second.sessionId)).revokedAt).not.toBeNull();
      });
    });

    describe("revocation and authentication", () => {
      it("revokes one session without touching the user's other sessions", async () => {
        const user = await makeUser("revoke-one");
        const a = await createSession(user.id);
        const b = await createSession(user.id);
        await revokeSession(a.sessionId);
        expect(await authenticateAccessToken(a.accessToken)).toBeNull();
        expect((await rotateRefreshToken(a.refreshToken)).ok).toBe(false);
        expect((await authenticateAccessToken(b.accessToken))?.id).toBe(
          user.id,
        );
      });

      it("revokes every session of a user and leaves other users alone", async () => {
        const user = await makeUser("revoke-all");
        const bystander = await makeUser("bystander");
        const a = await createSession(user.id);
        const b = await createSession(user.id);
        const c = await createSession(bystander.id);
        await revokeAllUserSessions(user.id);
        expect(await authenticateAccessToken(a.accessToken)).toBeNull();
        expect(await authenticateAccessToken(b.accessToken)).toBeNull();
        expect((await authenticateAccessToken(c.accessToken))?.id).toBe(
          bystander.id,
        );
      });

      it("reads the role from the database, never from the token", async () => {
        const user = await makeUser("role");
        const session = await createSession(user.id);
        expect((await authenticateAccessToken(session.accessToken))?.role).toBe(
          "user",
        );
        await getDb().user.update({
          where: { id: user.id },
          data: { role: "admin" },
        });
        expect((await authenticateAccessToken(session.accessToken))?.role).toBe(
          "admin",
        );
      });

      it("rejects missing, garbage and suspended-account tokens and never exposes credentials", async () => {
        const user = await makeUser("authn");
        const session = await createSession(user.id);
        const me = await authenticateAccessToken(session.accessToken);
        expect(me).not.toBeNull();
        expect(Object.keys(me ?? {})).not.toContain("passwordHash");

        expect(await authenticateAccessToken(undefined)).toBeNull();
        expect(await authenticateAccessToken("garbage")).toBeNull();
        await getDb().user.update({
          where: { id: user.id },
          data: { status: "suspended" },
        });
        expect(await authenticateAccessToken(session.accessToken)).toBeNull();
      });
    });
  },
);
