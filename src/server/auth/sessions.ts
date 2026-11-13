import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/server/db/client";
import { authConfig } from "./config";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";
import { hashToken, safeEqualHex } from "./tokens";

export type SessionMeta = {
  userAgent?: string | null;
  ipAddress?: string | null;
};
export type SessionTokens = {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
};

const clip = (value: string | null | undefined, max: number) =>
  value ? value.slice(0, max) : null;

/** Creates a session with its first refresh token. Only the token hash is stored. */
export async function createSession(
  userId: string,
  meta: SessionMeta = {},
): Promise<SessionTokens> {
  const sessionId = randomUUID();
  const jti = randomUUID();
  const now = new Date();
  const refreshExpiresAt = new Date(
    now.getTime() + authConfig.refreshTtlSeconds * 1000,
  );

  const refreshToken = await signRefreshToken({ userId, sessionId, jti }, now);
  const accessToken = await signAccessToken({ userId, sessionId }, now);

  await getDb().authSession.create({
    data: {
      id: sessionId,
      userId,
      expiresAt: refreshExpiresAt,
      lastUsedAt: now,
      userAgent: clip(meta.userAgent, 255),
      ipAddress: clip(meta.ipAddress, 64),
      refreshTokens: {
        create: {
          jti,
          tokenHash: hashToken(refreshToken),
          expiresAt: refreshExpiresAt,
        },
      },
    },
  });

  return { sessionId, accessToken, refreshToken, refreshExpiresAt };
}

const CONCURRENT_GRACE_MS = 10_000;
const TX = { timeout: 15_000, maxWait: 10_000 } as const;

export type RotateResult =
  | { ok: true; tokens: SessionTokens }
  | { ok: false; reason: "invalid" | "replay" | "concurrent" };

/**
 * One-time-use refresh rotation.
 * - invalid:    bad, expired or unknown token (clear cookies)
 * - replay:     a used token came back after the grace window; the session is revoked (clear cookies)
 * - concurrent: a sibling request just rotated it; do NOT clear cookies, the client should retry
 */
export async function rotateRefreshToken(
  rawToken: string,
): Promise<RotateResult> {
  const claims = await verifyRefreshToken(rawToken);
  if (!claims) return { ok: false, reason: "invalid" };

  const db = getDb();
  const now = new Date();
  const row = await db.authRefreshToken.findUnique({
    where: { jti: claims.jti },
    include: {
      session: {
        select: {
          id: true,
          userId: true,
          revokedAt: true,
          expiresAt: true,
          user: { select: { status: true } },
        },
      },
    },
  });

  if (
    !row ||
    row.sessionId !== claims.sessionId ||
    row.session.userId !== claims.userId ||
    !safeEqualHex(row.tokenHash, hashToken(rawToken))
  ) {
    return { ok: false, reason: "invalid" };
  }

  const { session } = row;
  if (session.revokedAt || session.expiresAt <= now || row.expiresAt <= now) {
    return { ok: false, reason: "invalid" };
  }
  if (session.user.status !== "active") {
    await revokeSession(session.id);
    return { ok: false, reason: "invalid" };
  }

  if (row.consumedAt || row.revokedAt) {
    const justConsumed =
      row.consumedAt !== null &&
      row.revokedAt === null &&
      now.getTime() - row.consumedAt.getTime() < CONCURRENT_GRACE_MS;
    if (justConsumed) return { ok: false, reason: "concurrent" };
    await revokeSession(session.id); // replay: assume the token family is compromised
    return { ok: false, reason: "replay" };
  }

  const newJti = randomUUID();
  const refreshExpiresAt = new Date(
    now.getTime() + authConfig.refreshTtlSeconds * 1000,
  );
  const refreshToken = await signRefreshToken(
    { userId: claims.userId, sessionId: session.id, jti: newJti },
    now,
  );
  const accessToken = await signAccessToken(
    { userId: claims.userId, sessionId: session.id },
    now,
  );

  const claimed = await db.$transaction(async (tx) => {
    // Only one caller can flip consumedAt from null; the rest lose the race.
    const updated = await tx.authRefreshToken.updateMany({
      where: { jti: claims.jti, consumedAt: null, revokedAt: null },
      data: { consumedAt: now, replacedByJti: newJti },
    });
    if (updated.count !== 1) return false;
    await tx.authRefreshToken.create({
      data: {
        sessionId: session.id,
        jti: newJti,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
      },
    });
    await tx.authSession.update({
      where: { id: session.id },
      data: { lastUsedAt: now, expiresAt: refreshExpiresAt },
    });
    return true;
  }, TX);

  if (!claimed) return { ok: false, reason: "concurrent" };
  return {
    ok: true,
    tokens: {
      sessionId: session.id,
      accessToken,
      refreshToken,
      refreshExpiresAt,
    },
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db.$transaction([
    db.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: now },
    }),
    db.authRefreshToken.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db.$transaction([
    db.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    }),
    db.authRefreshToken.updateMany({
      where: { session: { userId }, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);
}
