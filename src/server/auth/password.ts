import "server-only";
import { hash, verify } from "@node-rs/argon2";

// OWASP minimum for Argon2id: 19 MiB memory, 2 iterations, 1 lane.
// The library's default algorithm is Argon2id (checked by a test).
const options = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, options);
}

export async function verifyPassword(
  storedHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch {
    return false; // malformed hash
  }
}
