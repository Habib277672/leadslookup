import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createSession } from "@/server/auth/sessions";
import { getDb } from "@/server/db/client";
import { listActiveSessions, revokeOwnSession } from "./service";

const tag = randomUUID().slice(0, 8);

async function makeUser(name: string) {
  const email = `${name}-${tag}@example.test`;
  return getDb().user.create({
    data: {
      email,
      emailNormalized: email,
      displayName: name,
      status: "active",
      emailVerifiedAt: new Date(),
    },
  });
}

describe.skipIf(!process.env.DATABASE_URL)("active sessions", () => {
  afterAll(async () => {
    const db = getDb();
    await db.user.deleteMany({
      where: { emailNormalized: { endsWith: `-${tag}@example.test` } },
    });
    await db.$disconnect();
  });

  it("lists only the caller's live sessions", async () => {
    const a = await makeUser("list-a");
    const b = await makeUser("list-b");
    const a1 = await createSession(a.id);
    const a2 = await createSession(a.id);
    await createSession(b.id);

    expect(await revokeOwnSession(a.id, a2.sessionId)).toBe(true);

    const listed = await listActiveSessions(a.id);
    expect(listed.map((s) => s.id)).toEqual([a1.sessionId]);
  });

  it("hides expired sessions", async () => {
    const user = await makeUser("list-expired");
    const live = await createSession(user.id);
    const old = await createSession(user.id);
    await getDb().authSession.update({
      where: { id: old.sessionId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const listed = await listActiveSessions(user.id);
    expect(listed.map((s) => s.id)).toEqual([live.sessionId]);
  });

  it("refuses to revoke another user's session", async () => {
    const owner = await makeUser("owner");
    const attacker = await makeUser("attacker");
    const victim = await createSession(owner.id);

    expect(await revokeOwnSession(attacker.id, victim.sessionId)).toBe(false);

    const row = await getDb().authSession.findUniqueOrThrow({
      where: { id: victim.sessionId },
      include: { refreshTokens: true },
    });
    expect(row.revokedAt).toBeNull();
    expect(row.refreshTokens.every((t) => t.revokedAt === null)).toBe(true);
  });

  it("revokes the session and its refresh tokens, once", async () => {
    const user = await makeUser("revoke-own");
    const session = await createSession(user.id);

    expect(await revokeOwnSession(user.id, session.sessionId)).toBe(true);
    expect(await revokeOwnSession(user.id, session.sessionId)).toBe(false);

    const row = await getDb().authSession.findUniqueOrThrow({
      where: { id: session.sessionId },
      include: { refreshTokens: true },
    });
    expect(row.revokedAt).not.toBeNull();
    expect(row.refreshTokens.every((t) => t.revokedAt !== null)).toBe(true);
  });
});
