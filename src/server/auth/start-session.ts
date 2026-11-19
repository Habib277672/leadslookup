import "server-only";
import { cookies } from "next/headers";
import { logError } from "@/server/http/log";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./cookies";
import { verifyAccessToken, verifyRefreshToken } from "./jwt";
import {
  createSession,
  retireSessions,
  type SessionMeta,
  type SessionTokens,
} from "./sessions";

/** Sessions this browser already holds, found from its own cookies. */
async function browserSessionIds(): Promise<string[]> {
  const store = await cookies();
  const ids = new Set<string>();

  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    const claims = await verifyRefreshToken(refresh);
    if (claims) ids.add(claims.sessionId);
  }
  // The refresh cookie is Strict, so it is missing after the Google redirect.
  const access = store.get(ACCESS_COOKIE)?.value;
  if (access) {
    const claims = await verifyAccessToken(access);
    if (claims) ids.add(claims.sessionId);
  }
  return [...ids];
}

/** Use this at every sign-in. createSession stays pure so tests can call it directly. */
export async function startSession(
  userId: string,
  meta: SessionMeta = {},
): Promise<SessionTokens> {
  const previous = await browserSessionIds();
  const tokens = await createSession(userId, meta);
  try {
    await retireSessions({
      userId,
      keepSessionId: tokens.sessionId,
      browserSessionIds: previous,
      singleSession: process.env.AUTH_SINGLE_SESSION === "true",
    });
  } catch (error) {
    // The new session is valid; a failed cleanup must not break the login.
    logError("auth.retire-sessions", error);
  }
  return tokens;
}
