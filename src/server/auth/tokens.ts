import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** 256-bit random token for email verification and password reset links. */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/** What we store in the database instead of the raw token. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return (
    left.length > 0 &&
    left.length === right.length &&
    timingSafeEqual(left, right)
  );
}
