import "server-only";
import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";
import { calculateJwkThumbprint, exportJWK, type JWK } from "jose";

type Keys = {
  privateKey: KeyObject;
  publicKey: KeyObject;
  kid: string;
  publicJwk: JWK;
};

let cached: Promise<Keys> | undefined;

export function getKeys(): Promise<Keys> {
  if (!cached) {
    cached = load().catch((error: unknown) => {
      cached = undefined; // do not cache a failure
      throw error;
    });
  }
  return cached;
}

async function load(): Promise<Keys> {
  const encoded = process.env.AUTH_JWT_PRIVATE_KEY_B64;
  if (!encoded) throw new Error("AUTH_JWT_PRIVATE_KEY_B64 is not set");

  const privateKey = createPrivateKey(
    Buffer.from(encoded, "base64").toString("utf8"),
  );
  if (
    privateKey.asymmetricKeyType !== "rsa" ||
    (privateKey.asymmetricKeyDetails?.modulusLength ?? 0) < 2048
  ) {
    throw new Error(
      "AUTH_JWT_PRIVATE_KEY_B64 must be an RSA key of 2048+ bits",
    );
  }

  const publicKey = createPublicKey(privateKey);
  const jwk = await exportJWK(publicKey);
  const kid = await calculateJwkThumbprint(jwk, "sha256");

  return {
    privateKey,
    publicKey,
    kid,
    publicJwk: { ...jwk, kid, alg: "RS256", use: "sig" },
  };
}
