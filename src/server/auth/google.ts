import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { siteConfig } from "@/config/site";
import { safeEqualString } from "./tokens";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export const googleRedirectUri = () =>
  `${siteConfig.url}/api/v1/auth/google/callback`;

export function getGoogleConfig(): {
  clientId: string;
  clientSecret: string;
} | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** Fresh per-attempt secrets. The challenge is S256 of the verifier. */
export function createFlowSecrets() {
  const codeVerifier = randomBytes(48).toString("base64url"); // 64 chars
  return {
    state: randomBytes(32).toString("base64url"),
    nonce: randomBytes(32).toString("base64url"),
    codeVerifier,
    codeChallenge: createHash("sha256")
      .update(codeVerifier)
      .digest("base64url"),
  };
}

export function buildAuthorizationUrl(args: {
  clientId: string;
  state: string;
  nonce: string;
  codeChallenge: string;
}): string {
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: args.clientId,
    redirect_uri: googleRedirectUri(),
    scope: "openid email profile",
    state: args.state,
    nonce: args.nonce,
    code_challenge: args.codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

/** Returns the raw ID token, or null on any failure. */
export async function exchangeCode(
  args: {
    code: string;
    codeVerifier: string;
    clientId: string;
    clientSecret: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const response = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: args.code,
        code_verifier: args.codeVerifier,
        client_id: args.clientId,
        client_secret: args.clientSecret,
        redirect_uri: googleRedirectUri(),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { id_token?: unknown };
    return typeof json.id_token === "string" ? json.id_token : null;
  } catch {
    return null;
  }
}

export type GoogleProfile = { sub: string; email: string; name: string | null };

let remoteJwks: JWTVerifyGetKey | undefined;
const googleKeys = () =>
  (remoteJwks ??= createRemoteJWKSet(new URL(JWKS_URL), {
    timeoutDuration: 5000,
  }));

/** Returns null for anything that is not a fully valid Google ID token for this attempt. */
export async function verifyIdToken(
  idToken: string,
  options: {
    clientId: string;
    nonce: string;
    jwks?: JWTVerifyGetKey;
    now?: Date;
  },
): Promise<GoogleProfile | null> {
  try {
    const { payload } = await jwtVerify(idToken, options.jwks ?? googleKeys(), {
      algorithms: ["RS256"],
      issuer: ISSUERS,
      audience: options.clientId,
      requiredClaims: ["sub", "exp", "iat"],
      currentDate: options.now,
    });
    const { sub, email, name, nonce } = payload;
    if (typeof nonce !== "string" || !safeEqualString(nonce, options.nonce))
      return null;
    if (typeof sub !== "string" || sub.length === 0 || sub.length > 255)
      return null;
    if (typeof email !== "string" || email.length === 0 || email.length > 254)
      return null;
    if (payload.email_verified !== true) return null;
    return {
      sub,
      email,
      name: typeof name === "string" ? name.trim().slice(0, 80) || null : null,
    };
  } catch {
    return null;
  }
}
