import { generateKeyPairSync, randomUUID, type KeyObject } from "node:crypto";
import { SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { authConfig } from "./config";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";
import { getKeys } from "./keys";
import { getJwks, getOpenIdConfiguration } from "./oidc";
import { hashPassword, verifyPassword } from "./password";
import { generateOpaqueToken, hashToken, safeEqualHex } from "./tokens";

let privateKey: KeyObject;
let kid: string;
const claims = { userId: randomUUID(), sessionId: randomUUID() };

beforeAll(async () => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  privateKey = pair.privateKey;
  const pem = privateKey.export({ type: "pkcs8", format: "pem" });
  process.env.AUTH_JWT_PRIVATE_KEY_B64 = Buffer.from(pem).toString("base64");
  kid = (await getKeys()).kid;
});

// Signs a token with the real key but arbitrary claims, to test rejection.
function forge(
  payload: Record<string, unknown>,
  header: Record<string, unknown> = { alg: "RS256", kid },
) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    role: "authenticated",
    sid: claims.sessionId,
    token_use: "access",
    ...payload,
  })
    .setProtectedHeader(header as { alg: string })
    .setIssuer(authConfig.issuer)
    .setAudience(authConfig.accessAudience)
    .setSubject(claims.userId)
    .setIssuedAt(now)
    .setExpirationTime(now + 600)
    .sign(privateKey);
}

describe("password hashing", () => {
  it("uses Argon2id with a random salt", async () => {
    const a = await hashPassword("correct horse battery");
    const b = await hashPassword("correct horse battery");
    expect(a.startsWith("$argon2id$")).toBe(true);
    expect(a).not.toBe(b);
  });

  it("verifies the right password and rejects wrong or malformed input", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(await verifyPassword(stored, "correct horse battery")).toBe(true);
    expect(await verifyPassword(stored, "wrong password")).toBe(false);
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });
});

describe("opaque tokens", () => {
  it("generates 256-bit unique tokens", () => {
    const a = generateOpaqueToken();
    expect(a).toHaveLength(43);
    expect(a).not.toBe(generateOpaqueToken());
  });

  it("hashes deterministically and compares safely", () => {
    const token = generateOpaqueToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(safeEqualHex(hashToken(token), hashToken(token))).toBe(true);
    expect(safeEqualHex(hashToken(token), hashToken("other"))).toBe(false);
    expect(safeEqualHex("abcd", "abcdef")).toBe(false);
    expect(safeEqualHex("", "")).toBe(false);
  });
});

describe("access tokens", () => {
  it("round-trips and carries the required claims", async () => {
    const token = await signAccessToken(claims);
    expect(await verifyAccessToken(token)).toEqual(claims);
    const [header, body] = token
      .split(".")
      .slice(0, 2)
      .map((p) => JSON.parse(Buffer.from(p, "base64url").toString()));
    expect(header).toMatchObject({ alg: "RS256", kid });
    expect(body).toMatchObject({
      role: "authenticated",
      token_use: "access",
      sid: claims.sessionId,
      sub: claims.userId,
    });
  });

  it("rejects expired, tampered and refresh tokens", async () => {
    const expired = await signAccessToken(
      claims,
      new Date(Date.now() - 2 * 60 * 60 * 1000),
    );
    expect(await verifyAccessToken(expired)).toBeNull();

    const good = await signAccessToken(claims);
    const tampered = good.slice(0, -3) + (good.endsWith("AAA") ? "BBB" : "AAA");
    expect(await verifyAccessToken(tampered)).toBeNull();

    const refresh = await signRefreshToken({ ...claims, jti: randomUUID() });
    expect(await verifyAccessToken(refresh)).toBeNull();
  });

  it("rejects wrong issuer, audience, role, token_use, missing kid and bad subject", async () => {
    const now = Math.floor(Date.now() / 1000);
    const base = {
      role: "authenticated",
      sid: claims.sessionId,
      token_use: "access",
    };
    const mint = (
      mutate: (j: SignJWT) => SignJWT,
      header: Record<string, unknown> = { alg: "RS256", kid },
    ) =>
      mutate(
        new SignJWT(base)
          .setProtectedHeader(header as { alg: string })
          .setIssuer(authConfig.issuer)
          .setAudience(authConfig.accessAudience)
          .setSubject(claims.userId)
          .setIssuedAt(now)
          .setExpirationTime(now + 600),
      ).sign(privateKey);

    expect(
      await verifyAccessToken(
        await mint((j) => j.setIssuer("https://evil.example")),
      ),
    ).toBeNull();
    expect(
      await verifyAccessToken(await mint((j) => j.setAudience("someone-else"))),
    ).toBeNull();
    expect(
      await verifyAccessToken(await mint((j) => j.setSubject("not-a-uuid"))),
    ).toBeNull();
    expect(
      await verifyAccessToken(await forge({ role: "service_role" })),
    ).toBeNull();
    expect(
      await verifyAccessToken(await forge({ token_use: "refresh" })),
    ).toBeNull();
    expect(
      await verifyAccessToken(await mint((j) => j, { alg: "RS256" })),
    ).toBeNull();
    expect(
      await verifyAccessToken(
        await mint((j) => j, { alg: "RS256", kid: "other-key" }),
      ),
    ).toBeNull();
  });
});

describe("refresh tokens", () => {
  it("round-trips with jti and expiry", async () => {
    const jti = randomUUID();
    const token = await signRefreshToken({ ...claims, jti });
    const verified = await verifyRefreshToken(token);
    expect(verified).toMatchObject({ ...claims, jti });
    expect(verified!.expiresAt.getTime()).toBeGreaterThan(
      Date.now() + 29 * 24 * 60 * 60 * 1000,
    );
  });

  it("rejects access tokens and expired tokens", async () => {
    expect(await verifyRefreshToken(await signAccessToken(claims))).toBeNull();
    const old = await signRefreshToken(
      { ...claims, jti: randomUUID() },
      new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    );
    expect(await verifyRefreshToken(old)).toBeNull();
  });
});

describe("OIDC metadata", () => {
  it("publishes only the public key", async () => {
    const { keys } = await getJwks();
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatchObject({
      kty: "RSA",
      alg: "RS256",
      use: "sig",
      kid,
    });
    expect(keys[0]).not.toHaveProperty("d");
    expect(keys[0]).not.toHaveProperty("p");
  });

  it("points the discovery document at the JWKS", () => {
    const config = getOpenIdConfiguration();
    expect(config.issuer).toBe(authConfig.issuer);
    expect(config.jwks_uri).toBe(`${authConfig.issuer}/.well-known/jwks.json`);
  });
});
