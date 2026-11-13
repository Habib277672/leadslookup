import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/server/db/client";
import { authConfig } from "./config";
import { signAccessToken, signRefreshToken } from "./jwt";
import { hashToken } from "./tokens";

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
