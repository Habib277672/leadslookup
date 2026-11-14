import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { authConfig } from "./config";
import { getKeys } from "./keys";

const production = process.env.NODE_ENV === "production";
export const FLOW_COOKIE = production ? "__Secure-ll_oauth" : "ll_oauth";
const FLOW_PATH = "/api/v1/auth/google";
const FLOW_AUDIENCE = "leadslookup:oauth-flow";
const FLOW_TTL_SECONDS = 10 * 60;

export type OAuthFlow = { state: string; nonce: string; codeVerifier: string };

/** Signed so the cookie cannot be forged or edited. Not encrypted: it is the browser's own secret. */
export async function signFlow(
  flow: OAuthFlow,
  now = new Date(),
): Promise<string> {
  const { privateKey, kid } = await getKeys();
  const iat = Math.floor(now.getTime() / 1000);
  return new SignJWT({
    token_use: "oauth_flow",
    state: flow.state,
    nonce: flow.nonce,
    cv: flow.codeVerifier,
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setIssuer(authConfig.issuer)
    .setAudience(FLOW_AUDIENCE)
    .setIssuedAt(iat)
    .setExpirationTime(iat + FLOW_TTL_SECONDS)
    .sign(privateKey);
}

export async function verifyFlow(
  token: string,
  now = new Date(),
): Promise<OAuthFlow | null> {
  const { publicKey, kid } = await getKeys();
  try {
    const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: authConfig.issuer,
      audience: FLOW_AUDIENCE,
      requiredClaims: ["exp", "iat"],
      currentDate: now,
    });
    if (protectedHeader.kid !== kid || payload.token_use !== "oauth_flow")
      return null;
    const { state, nonce, cv } = payload;
    if (
      typeof state !== "string" ||
      typeof nonce !== "string" ||
      typeof cv !== "string"
    ) {
      return null;
    }
    return { state, nonce, codeVerifier: cv };
  } catch {
    return null;
  }
}

// Lax, not Strict: the cookie must come back on the top-level redirect from Google.
const baseOptions = {
  httpOnly: true,
  secure: production,
  sameSite: "lax",
  path: FLOW_PATH,
} as const;

export async function setFlowCookie(flow: OAuthFlow): Promise<void> {
  const store = await cookies();
  store.set(FLOW_COOKIE, await signFlow(flow), {
    ...baseOptions,
    maxAge: FLOW_TTL_SECONDS,
  });
}

/** Reads the flow and always clears the cookie, so every attempt is single-use. */
export async function takeFlowCookie(): Promise<OAuthFlow | null> {
  const store = await cookies();
  const raw = store.get(FLOW_COOKIE)?.value;
  store.set(FLOW_COOKIE, "", { ...baseOptions, maxAge: 0 });
  return raw ? verifyFlow(raw) : null;
}
