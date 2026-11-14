import { generateKeyPairSync, randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "./jwt";
import { signFlow, verifyFlow } from "./oauth-flow";
import { safeEqualString } from "./tokens";

const flow = { state: "state-1", nonce: "nonce-1", codeVerifier: "verifier-1" };

beforeAll(() => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = pair.privateKey.export({ type: "pkcs8", format: "pem" });
  process.env.AUTH_JWT_PRIVATE_KEY_B64 = Buffer.from(pem).toString("base64");
});

describe("oauth flow cookie token", () => {
  it("round-trips", async () => {
    expect(await verifyFlow(await signFlow(flow))).toEqual(flow);
  });

  it("expires after 10 minutes", async () => {
    const old = await signFlow(flow, new Date(Date.now() - 11 * 60 * 1000));
    expect(await verifyFlow(old)).toBeNull();
  });

  it("rejects tampered and garbage tokens", async () => {
    const token = await signFlow(flow);
    expect(await verifyFlow(token.slice(0, -4) + "AAAA")).toBeNull();
    expect(await verifyFlow("garbage")).toBeNull();
  });

  it("is not interchangeable with access tokens", async () => {
    const access = await signAccessToken({
      userId: randomUUID(),
      sessionId: randomUUID(),
    });
    expect(await verifyFlow(access)).toBeNull();
    expect(await verifyAccessToken(await signFlow(flow))).toBeNull();
  });
});

describe("safeEqualString", () => {
  it("compares exactly", () => {
    expect(safeEqualString("abc", "abc")).toBe(true);
    expect(safeEqualString("abc", "abd")).toBe(false);
    expect(safeEqualString("abc", "abcd")).toBe(false);
    expect(safeEqualString("", "")).toBe(false);
  });
});
