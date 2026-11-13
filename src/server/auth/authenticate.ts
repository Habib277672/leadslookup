import "server-only";
import type { ThemePreference, UserRole } from "@/generated/prisma/enums";
import { getDb } from "@/server/db/client";
import { verifyAccessToken } from "./jwt";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  themePreference: ThemePreference;
  sessionId: string;
};

/**
 * Token signature is not enough: the session must still be live and the
 * account active. Role is read from the database, never from the token.
 */
export async function authenticateAccessToken(
  token: string | undefined,
): Promise<CurrentUser | null> {
  if (!token) return null;
  const claims = await verifyAccessToken(token);
  if (!claims) return null;

  const session = await getDb().authSession.findFirst({
    where: {
      id: claims.sessionId,
      userId: claims.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
      user: { status: "active" },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          themePreference: true,
        },
      },
    },
  });
  return session ? { ...session.user, sessionId: claims.sessionId } : null;
}
