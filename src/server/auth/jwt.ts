import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { authConfig } from "./config";
import { getKeys } from "./keys";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AccessClaims = { userId: string; sessionId: string };
export type RefreshClaims = AccessClaims & { jti: string };
export type VerifiedRefresh = RefreshClaims & { expiresAt: Date };

const seconds = (d: Date) => Math.floor(d.getTime() / 1000);

// The optional `now` exists so tests can mint expired tokens.
export async function signAccessToken(
  { userId, sessionId }: AccessClaims,
  now = new Date(),
): Promise<string> {
  const { privateKey, kid } = await getKeys();
  const iat = seconds(now);
  return new SignJWT({
    role: "authenticated",
    sid: sessionId,
    token_use: "access",
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(authConfig.issuer)
    .setAudience(authConfig.accessAudience)
    .setSubject(userId)
    .setIssuedAt(iat)
    .setExpirationTime(iat + authConfig.accessTtlSeconds)
    .sign(privateKey);
}

export async function signRefreshToken(
  { userId, sessionId, jti }: RefreshClaims,
  now = new Date(),
): Promise<string> {
  const { privateKey, kid } = await getKeys();
  const iat = seconds(now);
  return new SignJWT({ sid: sessionId, token_use: "refresh" })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(authConfig.issuer)
    .setAudience(authConfig.refreshAudience)
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt(iat)
    .setExpirationTime(iat + authConfig.refreshTtlSeconds)
    .sign(privateKey);
}

/** Returns null for any invalid token. Callers must not reveal why. */
export async function verifyAccessToken(
  token: string,
  now = new Date(),
): Promise<AccessClaims | null> {
  const { publicKey, kid } = await getKeys();
  try {
    const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: authConfig.issuer,
      audience: authConfig.accessAudience,
      requiredClaims: ["sub", "sid", "exp", "iat"],
      currentDate: now,
    });
    if (protectedHeader.kid !== kid) return null;
    if (payload.token_use !== "access" || payload.role !== "authenticated") {
      return null;
    }
    const { sub, sid } = payload;
    if (typeof sub !== "string" || typeof sid !== "string") return null;
    if (!UUID.test(sub) || !UUID.test(sid)) return null;
    return { userId: sub, sessionId: sid };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
  now = new Date(),
): Promise<VerifiedRefresh | null> {
  const { publicKey, kid } = await getKeys();
  try {
    const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: authConfig.issuer,
      audience: authConfig.refreshAudience,
      requiredClaims: ["sub", "sid", "jti", "exp", "iat"],
      currentDate: now,
    });
    if (protectedHeader.kid !== kid) return null;
    if (payload.token_use !== "refresh") return null;
    const { sub, sid, jti, exp } = payload;
    if (
      typeof sub !== "string" ||
      typeof sid !== "string" ||
      typeof jti !== "string" ||
      typeof exp !== "number"
    ) {
      return null;
    }
    if (!UUID.test(sub) || !UUID.test(sid)) return null;
    return {
      userId: sub,
      sessionId: sid,
      jti,
      expiresAt: new Date(exp * 1000),
    };
  } catch {
    return null;
  }
}
