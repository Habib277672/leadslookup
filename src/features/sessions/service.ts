import "server-only";
import { getDb } from "@/server/db/client";

export type ActiveSession = {
  id: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
};

/** The caller's own live sessions only. userId always comes from the verified session. */
export async function listActiveSessions(
  userId: string,
): Promise<ActiveSession[]> {
  return getDb().authSession.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      lastUsedAt: true,
      userAgent: true,
      ipAddress: true,
    },
    take: 50,
  });
}

/**
 * Revokes one session, but only if it belongs to userId.
 * Returns false when it does not exist, is not theirs, or is already revoked.
 */
export async function revokeOwnSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const db = getDb();
  const now = new Date();
  const owned = await db.authSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: now },
  });
  if (owned.count === 0) return false;
  await db.authRefreshToken.updateMany({
    where: { sessionId, revokedAt: null },
    data: { revokedAt: now },
  });
  return true;
}
