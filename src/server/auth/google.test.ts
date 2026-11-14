import { createHash } from "node:crypto";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/config/site";
import {
  buildAuthorizationUrl,
  createFlowSecrets,
  exchangeCode,
  verifyIdToken,
} from "./google";

type Key = Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];

const CLIENT = "client-123.apps.googleusercontent.com";
const NONCE = "nonce-abc";
const nowSec = Math.floor(Date.now() / 1000);

let privateKey: Key;
let otherKey: Key;
let jwks: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  otherKey = (await generateKeyPair("RS256")).privateKey;
  jwks = createLocalJWKSet({
    keys: [
      {
        ...(await exportJWK(pair.publicKey)),
        kid: "k1",
        alg: "RS256",
        use: "sig",
      },
    ],
  });
});

function mint(
  claims: Record<string, unknown> = {},
  o: { key?: Key; iss?: string; aud?: string; iat?: number; exp?: number } = {},
) {
  return new SignJWT({
    sub: "1234567890",
    email: "jane@example.test",
    email_verified: true,
    name: "  Jane Doe ",
    nonce: NONCE,
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(o.iss ?? "https://accounts.google.com")
    .setAudience(o.aud ?? CLIENT)
    .setIssuedAt(o.iat ?? nowSec)
    .setExpirationTime(o.exp ?? nowSec + 3600)
    .sign(o.key ?? privateKey);
}

const verify = (token: string) =>
  verifyIdToken(token, { clientId: CLIENT, nonce: NONCE, jwks });

describe("verifyIdToken", () => {
  it("accepts a valid token and trims the name", async () => {
    expect(await verify(await mint())).toEqual({
      sub: "1234567890",
      email: "jane@example.test",
      name: "Jane Doe",
    });
  });

  it("accepts Google's bare issuer form", async () => {
    expect(
      await verify(await mint({}, { iss: "accounts.google.com" })),
    ).not.toBeNull();
  });

  it("returns a null name when Google sends none", async () => {
    expect((await verify(await mint({ name: undefined })))?.name).toBeNull();
  });

  it("rejects a wrong or missing nonce", async () => {
    expect(await verify(await mint({ nonce: "other" }))).toBeNull();
    expect(await verify(await mint({ nonce: undefined }))).toBeNull();
  });

  it("rejects a wrong audience, a wrong issuer and an expired token", async () => {
    expect(await verify(await mint({}, { aud: "someone-else" }))).toBeNull();
    expect(
      await verify(await mint({}, { iss: "https://evil.example" })),
    ).toBeNull();
    expect(
      await verify(await mint({}, { iat: nowSec - 7200, exp: nowSec - 3600 })),
    ).toBeNull();
  });

  it("rejects unverified, string-typed or missing emails", async () => {
    expect(await verify(await mint({ email_verified: false }))).toBeNull();
    expect(await verify(await mint({ email_verified: "true" }))).toBeNull();
    expect(await verify(await mint({ email: undefined }))).toBeNull();
  });

  it("rejects a missing subject", async () => {
    expect(await verify(await mint({ sub: undefined }))).toBeNull();
  });

  it("rejects tokens signed by another key, tampered tokens and garbage", async () => {
    expect(await verify(await mint({}, { key: otherKey }))).toBeNull();
    const token = await mint();
    expect(await verify(token.slice(0, -4) + "AAAA")).toBeNull();
    expect(await verify("not-a-jwt")).toBeNull();
  });
});

describe("flow secrets and authorization URL", () => {
  it("creates unique S256 PKCE material", () => {
    const a = createFlowSecrets();
    const b = createFlowSecrets();
    expect(a.state).not.toBe(b.state);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(a.codeChallenge).toBe(
      createHash("sha256").update(a.codeVerifier).digest("base64url"),
    );
  });

  it("builds the URL with PKCE, state, nonce and our redirect URI", () => {
    const secrets = createFlowSecrets();
    const url = new URL(
      buildAuthorizationUrl({ clientId: CLIENT, ...secrets }),
    );
    const p = url.searchParams;
    expect(url.origin + url.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(p.get("response_type")).toBe("code");
    expect(p.get("client_id")).toBe(CLIENT);
    expect(p.get("redirect_uri")).toBe(
      `${siteConfig.url}/api/v1/auth/google/callback`,
    );
    expect(p.get("scope")).toBe("openid email profile");
    expect(p.get("code_challenge_method")).toBe("S256");
    expect(p.get("code_challenge")).toBe(secrets.codeChallenge);
    expect(p.get("state")).toBe(secrets.state);
    expect(p.get("nonce")).toBe(secrets.nonce);
    expect(url.toString()).not.toContain(secrets.codeVerifier);
  });
});

describe("exchangeCode", () => {
  const args = {
    code: "c0de",
    codeVerifier: "verifier",
    clientId: CLIENT,
    clientSecret: "shh",
  };

  it("posts the PKCE verifier and returns the ID token", async () => {
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        expect(String(init?.body)).toContain("grant_type=authorization_code");
        expect(String(init?.body)).toContain("code_verifier=verifier");
        expect(String(init?.body)).toContain("redirect_uri=");
        return new Response(JSON.stringify({ id_token: "abc" }), {
          status: 200,
        });
      },
    );
    expect(await exchangeCode(args, fetchMock as unknown as typeof fetch)).toBe(
      "abc",
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://oauth2.googleapis.com/token",
    );
  });

  it("returns null on an error response, a missing token or a network failure", async () => {
    expect(
      await exchangeCode(
        args,
        (async () => new Response("{}", { status: 400 })) as typeof fetch,
      ),
    ).toBeNull();
    expect(
      await exchangeCode(
        args,
        (async () => new Response("{}", { status: 200 })) as typeof fetch,
      ),
    ).toBeNull();
    expect(
      await exchangeCode(args, (async () => {
        throw new TypeError("fetch failed");
      }) as typeof fetch),
    ).toBeNull();
  });
});
